// backend/src/routes/payments/features/marketplace/endpoints/refresh.js
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

const Order = require("../../../../../models/order.model");
const { hydrateOrderFromStripe } = require("../stripe.hydrate");
const {
  handleMarketplacePaymentEvent,
} = require("../../../handlers/marketplace.handler");

module.exports = async function refreshOrder(req, res) {
  try {
    const userId = req.auth?.userId;
    if (!userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });

    const { orderId, sessionId, paymentIntentId } = req.body || {};

    let order =
      (orderId && (await Order.findOne({ _id: orderId, user: userId }))) ||
      (sessionId &&
        (await Order.findOne({
          "stripe.checkoutSessionId": sessionId,
          user: userId,
        }))) ||
      (paymentIntentId &&
        (await Order.findOne({
          "stripe.paymentIntentId": paymentIntentId,
          user: userId,
        })));

    if (!order)
      return res.status(404).json({ ok: false, error: "Commande introuvable" });

    // ✅ OPTIMISATION : On regarde l'état AVANT de toucher à quoi que ce soit
    const wasAlreadySucceeded = order.status === "succeeded";

    // Gestion Crypto
    if (order.crypto?.provider === "manual_crypto") {
      return res.status(200).json({
        ok: true,
        data: {
          order: {
            id: String(order._id),
            status: order.status,
            paidAt: order.paidAt,
            crypto: order.crypto,
          },
        },
      });
    }

    // Gestion Stripe
    if (stripe) {
      // ... (code de récupération session/pi inchangé) ...
      let session = null;
      let pi = null;
      // Récupération Stripe (simplifiée pour la réponse)
      if (sessionId || order.stripe?.checkoutSessionId) {
        try {
          session = await stripe.checkout.sessions.retrieve(
            sessionId || order.stripe.checkoutSessionId,
            { expand: ["payment_intent"] },
          );
        } catch (e) {}
      }
      if (paymentIntentId || order.stripe?.paymentIntentId) {
        try {
          pi = await stripe.paymentIntents.retrieve(
            paymentIntentId || order.stripe.paymentIntentId,
          );
        } catch (e) {}
      }

      await hydrateOrderFromStripe({ order, session, pi, stripe });
      await order.save();
    }

    // ✅ SÉCURITÉ DOUBLON : On ne déclenche QUE si ça vient de passer à success
    // Si c'était DÉJÀ success (par le webhook), on ne fait rien ici.
    if (order.status === "succeeded" && !wasAlreadySucceeded) {
      console.log(
        `[Refresh] Commande ${order._id} vient de passer à SUCCEEDED. Déclenchement Handler.`,
      );
      await handleMarketplacePaymentEvent({
        status: "success",
        meta: { orderId: String(order._id) },
      });
    } else if (order.status === "succeeded" && wasAlreadySucceeded) {
      console.log(`[Refresh] Commande ${order._id} était déjà payée. Ignoré.`);
    }

    return res.status(200).json({
      ok: true,
      data: {
        order: {
          id: String(order._id),
          status: order.status,
          paidAt: order.paidAt,
          stripe: order.stripe,
        },
      },
    });
  } catch (e) {
    console.error("[Refresh] Error:", e);
    return res.status(500).json({ ok: false });
  }
};
