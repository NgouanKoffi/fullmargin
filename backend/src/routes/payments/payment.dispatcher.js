// backend/src/payments/payment.dispatcher.js

/**
 * DISPATCHER GLOBAL DES PAIEMENTS
 * — reçoit un PaymentEvent normalisé
 * — sélectionne la feature (course / marketplace / fm-metrix)
 * — appelle le handler métier correspondant
 *
 * OBJECTIF : ne jamais modifier les fichiers métier quand on ajoute
 * ou retire un provider de paiement.
 */

// Handlers métiers (UN SEUL par feature)
const { handleCoursePaymentEvent } = require("./handlers/course.handler");
const {
  handleMarketplacePaymentEvent,
} = require("./handlers/marketplace.handler");
const { handleFmMetrixPaymentEvent } = require("./handlers/fmmetrix.handler");

/**
 * Dispatcher principal
 * @param {PaymentEvent} payment
 */
async function dispatchPayment(payment) {
  if (!payment || typeof payment !== "object") {
    console.error("[PAYMENTS] Event invalide");
    return;
  }

  const { feature } = payment;

  if (!feature) {
    console.warn("[PAYMENTS] Aucun feature → impossible de router");
    return;
  }

  console.log(`[DISPATCHER] Processing payment for feature: ${feature}`);

  try {
    switch (feature) {
      case "course":
        return await handleCoursePaymentEvent(payment);

      case "marketplace":
        return await handleMarketplacePaymentEvent(payment);

      case "fm-metrix":
        return await handleFmMetrixPaymentEvent(payment);

      default:
        console.warn("[PAYMENTS] Feature inconnue:", feature);
        return;
    }
  } catch (err) {
    console.error("[PAYMENTS] Erreur dans le handler feature:", feature, err);
  }
}

module.exports = {
  dispatchPayment,
};
