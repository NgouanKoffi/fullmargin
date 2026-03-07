// backend/src/routes/payments/providers/feexpay.provider.js

/**
 * Normalise le statut FeexPay vers ton standard
 */
function normalizeFeexPayStatus(status) {
  const s = String(status).toUpperCase();
  if (s === "SUCCESSFUL" || s === "SUCCESS" || s === "PAID") return "success";
  if (s === "FAILED") return "failed";
  if (s === "CANCELED" || s === "EXPIRED") return "canceled";
  return "pending";
}

/**
 * Convertit un event FEEXPAY brut → PaymentEvent universel
 *
 * @param {object} payload - Le body reçu du webhook FeexPay
 */
async function convertFeexPayEvent(payload) {
  // 1. Extraction des métadonnées (FeexPay renvoie souvent custom_data en JSON string ou objet)
  let customData = payload.custom_data || {};

  // Si c'est une string JSON, on parse
  if (typeof customData === "string") {
    try {
      customData = JSON.parse(customData);
    } catch (e) {
      console.error("[FEEXPAY] Erreur parsing custom_data", e);
      customData = {};
    }
  }

  // 2. Détermination de la feature (exactement comme Stripe)
  const feature =
    customData.feature ||
    (customData.courseId ? "course" : null) ||
    (customData.orderId ? "marketplace" : null) ||
    (customData.userId ? "fm-metrix" : null);

  // 3. Extraction du montant (FeexPay envoie souvent "amount" en entier)
  const amount = payload.amount || 0;

  return {
    provider: "feexpay",

    // On utilise le statut envoyé par FeexPay
    status: normalizeFeexPayStatus(payload.status),

    feature: feature,

    transactionId: payload.reference || payload.id,

    amount: amount, // Vérifie si FeexPay envoie en centimes ou en unité. Souvent unité (CFA).
    currency: "xof", // FeexPay est souvent en XOF, adapte si besoin

    metadata: customData || {},

    // On stocke tout l'objet brut pour le debug
    raw: payload,
  };
}

module.exports = { convertFeexPayEvent };
