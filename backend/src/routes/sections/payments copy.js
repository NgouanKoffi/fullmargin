// backend/src/routes/sections/payments.js
module.exports = function paymentsSection(router) {
  /** ---------------- Marketplace Stripe (existant) ---------------- */
  try {
    const stripeRoutes = require("../payments/marketplace.stripe.js");
    router.use("/payments", stripeRoutes.router || stripeRoutes);
    router.use("/payments/stripe", stripeRoutes.router || stripeRoutes);
  } catch (e) {
    console.error("Failed to mount /payments routes:", e?.message || e);
  }

  /** ---------------- FM Metrix (existant) ---------------- */
  try {
    const fmMetrixStripe = require("../payments/fmmetrix.stripe.js");
    router.use("/payments", fmMetrixStripe.router || fmMetrixStripe);
  } catch (e) {
    console.error("Failed to mount /fm-metrix routes:", e?.message || e);
  }

  /** ---------------- Paiements mobile Fedapay (NOUVEAU) ----------- *
   *  - POST /api/payments/fedapay/create
   *  - POST /api/payments/fedapay/webhook
   *  --------------------------------------------------------------- */
  try {
    const fedapayRoutes = require("../payments/fedapay.js");
    router.use("/payments", fedapayRoutes.router || fedapayRoutes);
  } catch (e) {
    console.error("Failed to mount /payments Fedapay routes:", e?.message || e);
  }

  /** ============================================================
   *  ✅ Paiements de cours (checkout, refresh, orders mine, etc.)
   *  - POST /api/courses/payments/:id/checkout
   *  - POST /api/courses/payments/refresh
   *  - GET  /api/courses/payments/mine
   *  - GET  /api/courses/payments/:orderId
   *  ============================================================ */
  try {
    const courseStripe = require("../payments/courses.stripe.js");
    router.use("/courses/payments", courseStripe.router || courseStripe);
  } catch (e) {
    console.error("Failed to mount /courses/payments routes:", e?.message || e);
  }

  /** ============================================================
   *  ✅ Ventes / payouts vendeur (résumé + liste paginée)
   *  - GET /api/courses/payouts/mine
   *  - GET /api/courses/payouts/mine/summary
   *  ============================================================ */
  try {
    const coursePayouts = require("../payments/features/course.payouts.js");
    router.use("/courses/payouts", coursePayouts.router || coursePayouts);
  } catch (e) {
    console.error("Failed to mount /courses/payouts routes:", e?.message || e);
  }
};
