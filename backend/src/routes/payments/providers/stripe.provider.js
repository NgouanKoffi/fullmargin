// backend/src/payments/providers/stripe.provider.js
/**
 * Convertit un event STRIPE brut → un PaymentEvent universel
 *
 * Format PaymentEvent retourné :
 * {
 *   provider: "stripe",
 *   providerEvent: "payment_intent.succeeded" | ...
 *   status: "success" | "failed" | "pending" | "canceled",
 *   feature: "course" | "marketplace" | "fm-metrix",
 *   meta: {...},
 *   amount: Number,
 *   currency: String,
 *   customerEmail: String,
 *   raw: event
 * }
 */

function normalizeStripeStatus(event) {
  switch (event.type) {
    case "payment_intent.succeeded":
    case "checkout.session.completed":
      return "success";
    case "payment_intent.payment_failed":
    case "charge.failed":
      return "failed";
    case "checkout.session.expired":
      return "canceled";
    default:
      return "pending";
  }
}

async function convertStripeEvent(event) {
  const object = event.data?.object || {};
  const metadata = object.metadata || {};

  const feature =
    metadata.feature || metadata.courseId || metadata.courseOrderId
      ? "course"
      : metadata.orderId
      ? "marketplace"
      : metadata.userId
      ? "fm-metrix"
      : null;

  const amount =
    object.amount_total ||
    object.amount ||
    object.amount_received ||
    object.amount_paid ||
    null;

  const currency = object.currency || object.amount_details?.currency || "usd";

  return {
    provider: "stripe",
    providerEvent: event.type,
    status: normalizeStripeStatus(event),

    feature, // IMPORTANT

    meta: metadata || {},
    amount: typeof amount === "number" ? amount / 100 : null,
    currency: currency?.toLowerCase() || "usd",
    customerEmail:
      object.customer_email || object.customer_details?.email || null,

    raw: event,
  };
}

module.exports = { convertStripeEvent };
