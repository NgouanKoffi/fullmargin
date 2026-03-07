// backend/src/routes/sections/payments.js

module.exports = function paymentsSection(router) {
  /** ============================================================
   * 🔵 WEBHOOK STRIPE centralisé
   * - POST /api/payments/stripe/webhook
   * ============================================================ */
  try {
    const { stripeWebhookCore } = require("../payments/stripe.core");
    router.post("/payments/stripe/webhook", stripeWebhookCore);
  } catch (e) {
    console.error("Failed to mount Stripe webhook route:", e?.message || e);
  }

  /** ============================================================
   * 🟠 FEEXPAY (Mobile Money)
   * - POST /api/payments/feexpay/webhook (Webhook Automatique)
   * - POST /api/payments/feexpay/verify-sdk (Validation SDK Frontend)
   * ============================================================ */
  try {
    const {
      feexpayWebhookCore,
      verifyFeexPaySDK,
    } = require("../payments/feexpay.core");

    // Route webhook classique
    router.post("/payments/feexpay/webhook", feexpayWebhookCore);

    // ✅ NOUVELLE ROUTE pour que le SDK React valide le paiement instantanément
    if (verifyFeexPaySDK) {
      router.post("/payments/feexpay/verify-sdk", verifyFeexPaySDK);
    }
  } catch (e) {
    console.error("Failed to mount FeexPay routes:", e?.message || e);
  }

  // ❌ FEDAPAY SUPPRIMÉ COMME DEMANDÉ

  /** ============================================================
   * 🟢 MANUAL CRYPTO (Gestion interne)
   * Remplace l'ancien système NOWPayments
   * - POST /api/payments/crypto/create-intent
   * ============================================================ */
  try {
    const cryptoRoutes = require("../payments/crypto");
    router.use("/payments", cryptoRoutes.router || cryptoRoutes);
  } catch (e) {
    console.error("Failed to mount Crypto routes:", e?.message || e);
  }

  /** ============================================================
   * 🟡 Marketplace (checkout, refresh, orders...)
   * - monté sur /api/payments/...
   * -> /api/payments/checkout
   * -> /api/payments/checkout/free
   * -> /api/payments/refresh
   * ============================================================ */
  try {
    const marketplaceRoutes = require("../payments/features/marketplace");
    // ⬇️ montage direct sur /payments pour matcher le front
    router.use("/payments", marketplaceRoutes.router || marketplaceRoutes);
  } catch (e) {
    console.error("Failed to mount marketplace routes:", e?.message || e);
  }

  /** ============================================================
   * 🟢 FM-Metrix
   * - /api/payments/fm-metrix/checkout
   * - /api/payments/fm-metrix/access
   * - etc.
   * ============================================================ */
  try {
    const fmMetrixRoutes = require("../payments/features/fmmetrix");
    router.use("/payments", fmMetrixRoutes.router || fmMetrixRoutes);
  } catch (e) {
    console.error("Failed to mount FM-Metrix routes:", e?.message || e);
  }

  /** ============================================================
   * 🔴 Paiements des cours
   * - POST /api/courses/payments/:id/checkout
   * - POST /api/courses/payments/refresh
   * - GET  /api/courses/payments/mine
   * ============================================================ */
  try {
    const coursePayments = require("../payments/features/courses");
    router.use("/courses/payments", coursePayments.router || coursePayments);
  } catch (e) {
    console.error("Failed to mount course payment routes:", e?.message || e);
  }

  /** ============================================================
   * 🟤 Payouts des vendeurs de cours
   * - GET /api/courses/payouts/mine
   * - GET /api/courses/payouts/mine/summary
   * ============================================================ */
  try {
    const coursePayouts = require("../payments/features/course.payouts");
    router.use("/courses/payouts", coursePayouts.router || coursePayouts);
  } catch (e) {
    console.error("Failed to mount payouts routes:", e?.message || e);
  }
};
