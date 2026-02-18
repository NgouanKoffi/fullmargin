// backend/src/payments/providers/fedapay.provider.js
/**
 * Convertit un event FedaPay brut → PaymentEvent universel
 */

function normalizeFedaPayStatus(type) {
  if (type === "transaction.approved") return "success";
  if (type === "transaction.canceled" || type === "transaction.declined")
    return "failed";

  return "pending";
}

async function convertFedapayEvent(event) {
  const type = event.type || event.event || null;
  const data = event.data || {};

  const tx =
    data.object ||
    data["v1/transaction"] ||
    data.transaction ||
    event.transaction ||
    event;

  const metadata = tx.custom_metadata || tx.metadata || {};
  const feature = metadata.feature || null;

  const amount = tx.amount || tx.amount_to_pay || tx.amount_paid || null;

  const currency = tx.currency?.iso || "xof";

  return {
    provider: "fedapay",
    providerEvent: type,
    status: normalizeFedaPayStatus(type),

    feature,

    meta: metadata || {},
    amount: Number(amount) || null,
    currency: currency.toLowerCase(),
    customerEmail: tx.customer?.email || null,

    raw: event,
  };
}

module.exports = { convertFedapayEvent };
