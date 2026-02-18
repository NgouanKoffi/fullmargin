// backend/src/routes/payments/handlers/marketplace.handler.js
const Order = require("../../../models/order.model");
const Promo = require("../../../models/promoCode.model");
const User = require("../../../models/user.model");
const Mailer = require("../../../utils/mailer");

const { ensurePayoutsForOrder } = require("../../../services/payouts.service");
const {
  ensureLicensesForOrder,
} = require("../../../services/licenses/ensureLicensesForOrder");

const fmtMoney = (amount, currency) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

async function handleMarketplacePaymentEvent(payment) {
  try {
    const meta = payment?.meta || {};
    const orderId = meta.orderId || null;

    if (!orderId) {
      console.warn("[MARKET HANDLER] orderId manquant");
      return;
    }

    // 🔒 VERROUILLAGE ATOMIQUE (comme vu précédemment)
    let order = null;

    if (payment.status === "success") {
      order = await Order.findOneAndUpdate(
        { _id: orderId, promoApplied: { $ne: true } },
        {
          $set: {
            promoApplied: true,
            status: "succeeded",
            paidAt: new Date(),
          },
        },
        { new: true },
      ).populate("user", "name email profile");

      if (!order) {
        console.log(`[Handler] 🛑 Commande ${orderId} déjà traitée.`);
        return;
      }

      console.log(`[Handler] 🟢 Traitement UNIQUE démarré pour ${orderId}`);

      // --- A. GESTION PROMOS ---
      try {
        const usages = new Map();
        for (const item of order.items || []) {
          const code = item?.promo?.code;
          if (code) {
            const qty = Math.max(1, Number(item.qty) || 1);
            usages.set(code, (usages.get(code) || 0) + qty);
          }
        }
        for (const [code, inc] of usages.entries()) {
          await Promo.updateOne(
            { code: String(code).toUpperCase(), deletedAt: null },
            { $inc: { used: inc } },
          );
        }
      } catch (e) {
        console.warn("[Handler] Promo error", e);
      }

      // --- B. LIVRAISON (LICENCES + COMMISSIONS) ---
      // ensureLicensesForOrder ne générera une licence QUE si c'est un abonnement
      await ensureLicensesForOrder(order._id);
      await ensurePayoutsForOrder(order);

      // --- C. NOTIFICATION VENDEUR ---
      try {
        const sellerMap = new Map();
        for (const item of order.items) {
          const sid = String(item.seller);
          if (!sellerMap.has(sid)) sellerMap.set(sid, { items: [], total: 0 });
          const entry = sellerMap.get(sid);
          const lineTotal = (item.unitAmount || 0) * (item.qty || 1);
          entry.items.push({
            title: item.title,
            qty: item.qty,
            amount: fmtMoney(lineTotal, order.currency),
          });
          entry.total += lineTotal;
        }

        const sellerIds = Array.from(sellerMap.keys());
        if (sellerIds.length > 0) {
          const sellers = await User.find({ _id: { $in: sellerIds } }).select(
            "email name profile",
          );
          const buyerName =
            order.user?.profile?.fullName || order.user?.name || "Un client";

          for (const sellerUser of sellers) {
            const data = sellerMap.get(String(sellerUser._id));
            if (data && sellerUser.email) {
              await Mailer.sendMarketplaceSaleNotificationEmail({
                to: sellerUser.email,
                fullName: sellerUser.profile?.fullName || sellerUser.name,
                customerName: buyerName,
                items: data.items,
                totalEarnings: fmtMoney(data.total, order.currency),
              });
            }
          }
        }
      } catch (e) {
        console.error("[Handler] Erreur mail vendeur:", e);
      }

      // --- D. NOTIFICATION ACHETEUR ---
      // On envoie TOUJOURS le mail de confirmation de commande.
      // Si aucune licence n'a été générée (achat unique/téléchargement simple), ce sera le SEUL mail.
      try {
        if (order.user?.email) {
          const userName =
            order.user.profile?.fullName || order.user.name || "Client";
          const productTitle =
            order.items?.[0]?.title || "Commande Marketplace";

          if (
            order.crypto?.provider === "manual_crypto" ||
            order.provider === "crypto"
          ) {
            await Mailer.sendMarketplaceCryptoApprovedEmail({
              to: order.user.email,
              fullName: userName,
              productTitle,
            });
          } else {
            await Mailer.sendMarketplaceOrderSuccessEmail({
              to: order.user.email,
              fullName: userName,
              productTitle,
            });
          }
          console.log(
            `[Handler] ✉️ Mail Confirmation envoyé à ${order.user.email}`,
          );
        }
      } catch (e) {
        console.error("[Handler] Erreur mail acheteur:", e);
      }
    } else if (payment.status === "failed" || payment.status === "canceled") {
      await Order.updateOne({ _id: orderId }, { status: payment.status });
    }
  } catch (err) {
    console.error("[MARKET HANDLER] error:", err);
  }
}

module.exports = { handleMarketplacePaymentEvent };
