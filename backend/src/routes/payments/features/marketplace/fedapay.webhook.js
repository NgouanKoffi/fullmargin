// backend/src/routes/payments/features/marketplace/fedapay.webhook.js
const Order = require("../../../../models/order.model");
const {
  ensurePayoutsForOrder,
} = require("../../../../services/payouts.service");
const {
  ensureLicensesForOrder,
} = require("../../../../services/licenses/ensureLicensesForOrder");

const { hydrateOrderFromFedapay } = require("./fedapay.hydrate");

async function handleMarketplaceFedapayTransaction(payload) {
  try {
    const transaction = payload?.transaction || payload;
    if (!transaction) return;

    const meta = transaction.custom_metadata || {};
    const feature = meta.feature || meta.context || null;

    if (feature !== "marketplace") return;

    const orderId =
      meta.order_id || meta.orderId || meta.order || meta.orderID || null;

    if (!orderId) {
      console.warn(
        "[FEDAPAY][MARKETPLACE] transaction sans order_id dans custom_metadata"
      );
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(
        "[FEDAPAY][MARKETPLACE] commande introuvable pour order_id =",
        orderId
      );
      return;
    }

    await hydrateOrderFromFedapay({ order, transaction });
    await order.save();

    if (order.status === "succeeded") {
      // ✅ licences puis payouts
      await ensureLicensesForOrder(order._id);
      await ensurePayoutsForOrder(order);
    }
  } catch (e) {
    console.error(
      "[FEDAPAY][MARKETPLACE] handleMarketplaceFedapayTransaction error:",
      e?.message || e
    );
  }
}

module.exports = { handleMarketplaceFedapayTransaction };
