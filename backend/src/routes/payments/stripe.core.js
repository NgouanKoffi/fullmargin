// backend/src/routes/payments/stripe.core.js
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// nouveau import
const { convertStripeEvent } = require("./providers/stripe.provider");
const { dispatchPayment } = require("./payment.dispatcher");

async function stripeWebhookCore(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE] signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ➜ convertit Stripe → PaymentEvent universel
    const payment = await convertStripeEvent(event);

    // ➜ on envoie dans le DISPATCHER
    await dispatchPayment(payment);
  } catch (err) {
    console.error("[STRIPE] handler error:", err);
  }

  return res.json({ received: true });
}

module.exports = {
  stripeWebhookCore,
};
