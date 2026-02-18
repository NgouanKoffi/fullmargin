// backend/src/routes/payments/features/marketplace/stripe.webhook.js
const Order = require("../../../../../models/order.model");
const { hydrateOrderFromStripe } = require("./stripe.hydrate");

// ✅ Import du Handler centralisé
const {
  handleMarketplacePaymentEvent,
} = require("../../../handlers/marketplace.handler");

async function handleMarketplaceStripeEvent({ stripe, event, object }) {
  if (!stripe || !event) return;

  try {
    // 1. PAYMENT INTENT SUCCEEDED
    if (event.type === "payment_intent.succeeded") {
      const pi = await stripe.paymentIntents.retrieve(object.id, {
        expand: [
          "latest_charge",
          "latest_charge.balance_transaction",
          "payment_method",
        ],
      });

      const order = await Order.findOne({ "stripe.paymentIntentId": pi.id });

      if (order) {
        // 🛑 ANTI-DOUBLON STRIPE 🛑
        // Si cette commande vient d'un Checkout Session (lien de paiement),
        // on IGNORE cet événement "payment_intent".
        // On laissera l'événement "checkout.session.completed" (plus bas) faire le travail.
        if (order.stripe && order.stripe.checkoutSessionId) {
          console.log(
            `[Stripe Webhook] Ignoré payment_intent pour commande Session ${order._id}`,
          );
          return;
        }

        await hydrateOrderFromStripe({ order, pi, stripe });
        await order.save();

        if (order.status === "succeeded") {
          await handleMarketplacePaymentEvent({
            status: "success",
            meta: { orderId: String(order._id) },
          });
        }
      }
    }
    // 2. CHECKOUT SESSION COMPLETED (Le principal pour le Marketplace)
    else if (event.type === "checkout.session.completed") {
      const s = await stripe.checkout.sessions.retrieve(object.id, {
        expand: [
          "payment_intent",
          "customer_details",
          "payment_intent.latest_charge",
          "payment_intent.latest_charge.balance_transaction",
          "payment_intent.payment_method",
        ],
      });

      const order =
        (await Order.findOne({ "stripe.checkoutSessionId": s.id })) ||
        (await Order.findOne({ _id: s?.metadata?.orderId }));

      if (order) {
        await hydrateOrderFromStripe({
          order,
          session: s,
          pi: s.payment_intent,
          stripe,
        });
        await order.save();

        if (order.status === "succeeded") {
          // ✅ Délégation au Handler (Emails + Licences + Payouts)
          await handleMarketplacePaymentEvent({
            status: "success",
            meta: { orderId: String(order._id) },
          });
        }
      }
    }
    // 3. ECHECS
    else if (event.type === "payment_intent.payment_failed") {
      const order = await Order.findOne({
        "stripe.paymentIntentId": object.id,
      });
      if (order) {
        order.status = "failed";
        await order.save();
      }
    } else if (event.type === "checkout.session.expired") {
      const order = await Order.findOne({
        "stripe.checkoutSessionId": object.id,
      });
      if (order && order.status === "requires_payment") {
        order.status = "canceled";
        await order.save();
      }
    }
  } catch (e) {
    console.error(
      "[STRIPE][MARKETPLACE] webhook handler error:",
      e?.message || e,
    );
  }
}

module.exports = { handleMarketplaceStripeEvent };
