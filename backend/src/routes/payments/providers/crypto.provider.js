// backend/src/routes/payments/providers/crypto.provider.js

/**
 * Convertit un document d'abonnement MongoDB (Crypto Manuel) en PaymentEvent standard.
 *
 * Cette fonction sera appelée par l'Admin Dashboard quand tu valideras le paiement.
 *
 * @param {object} subscriptionDoc - Le document Mongoose (FmMetrixSubscription)
 * @param {string} forcedStatus - Le statut à forcer (ex: 'succeeded')
 * @returns {Promise<import("../../../payments/payment.types").PaymentEvent>}
 */
async function convertManualCryptoDocumentToEvent(
  subscriptionDoc,
  forcedStatus = "succeeded",
) {
  if (!subscriptionDoc) {
    throw new Error("Document de souscription manquant");
  }

  // 1. Récupération des infos brutes stockées dans raw
  const rawData = subscriptionDoc.raw || {};

  // 2. Détermination de la feature (si pas explicite, on déduit fm-metrix par défaut vu le modèle)
  // Tu pourras ajouter une logique si tu as d'autres types de produits crypto
  const feature = rawData.feature || "fm-metrix";

  // 3. Construction de l'objet normalisé
  return {
    provider: "manual_crypto",

    // ✅ CORRECTION ICI : Le handler attend "status" avec la valeur "success"
    // On transforme "active" ou "succeeded" en "success" pour le dispatcher.
    status:
      forcedStatus === "active" || forcedStatus === "succeeded"
        ? "success"
        : "pending",

    feature: feature,

    // Notre référence REF-... générée lors de la création
    transactionId:
      subscriptionDoc.stripeSubscriptionId || subscriptionDoc._id.toString(),

    amount: rawData.declaredAmount || 0,

    metadata: {
      userId: subscriptionDoc.userId,
      network: rawData.network,
      periodStart: subscriptionDoc.periodStart,
      periodEnd: subscriptionDoc.periodEnd,
    },

    raw: subscriptionDoc.toObject
      ? subscriptionDoc.toObject()
      : subscriptionDoc,
  };
}

module.exports = { convertManualCryptoDocumentToEvent };
