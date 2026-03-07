// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\marketplace\index.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("./_auth");

const stripeCheckout = require("./endpoints/stripe.checkout");
const cryptoCheckout = require("./endpoints/crypto.checkout");
// ✅ Import du endpoint FeexPay
const feexpayCheckout = require("./endpoints/feexpay.checkout");

const checkoutFree = require("./endpoints/checkout.free");
const refreshOrder = require("./endpoints/refresh");

// On garde l'hydrate Stripe pour le refresh
const { hydrateOrderFromStripe } = require("./stripe.hydrate");

// ✅ ping pour vérifier le montage
router.get("/__ping", (_req, res) =>
  res.json({ ok: true, feature: "marketplace" }),
);

// Routes Checkout
router.post("/checkout", requireAuth, stripeCheckout);

// ✅ Nouvelle route FeexPay (Mobile Money)
router.post("/checkout/feexpay", requireAuth, feexpayCheckout);

// Route Crypto (Manuel)
router.post("/checkout/crypto", requireAuth, cryptoCheckout);

// Route checkout gratuit
router.post("/checkout/free", requireAuth, checkoutFree);

// Route refresh
router.post("/refresh", requireAuth, refreshOrder);

module.exports = {
  router,
  hydrateOrderFromStripe,
};
