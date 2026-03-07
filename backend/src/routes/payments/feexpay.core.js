// backend/src/routes/payments/feexpay.core.js

const { dispatchPayment } = require("./payment.dispatcher");
const { convertFeexPayEvent } = require("./providers/feexpay.provider");

// --- ⚙️ CONFIGURATION DYNAMIQUE ---
const ENV_MODE = (process.env.FEEXPAY_ENV || "test").trim().toLowerCase();
const IS_LIVE = ENV_MODE === "live";

/**
 * 🟢 WEBHOOK FEEXPAY
 * Reçoit la confirmation de paiement envoyée par les serveurs FeexPay.
 */
async function feexpayWebhookCore(req, res) {
  try {
    const payload = req.body;
    console.log("[FEEXPAY WEBHOOK] Reçu:", JSON.stringify(payload, null, 2));

    const paymentEvent = await convertFeexPayEvent(payload);

    if (paymentEvent.feature) {
      await dispatchPayment(paymentEvent);
    } else {
      console.warn("[FEEXPAY] Feature non détectée, ignoré.");
    }

    return res.status(200).json({ status: "received" });
  } catch (err) {
    console.error("[FEEXPAY] Core error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * ✅ NOUVEAU : Validation manuelle via le SDK Frontend
 * Cette fonction est appelée par le frontend juste après le succès du bouton FeexPay.
 * Elle force le passage de la commande en "success".
 */
async function verifyFeexPaySDK(req, res) {
  try {
    const { feature, customId, reference } = req.body;
    console.log(
      `[FEEXPAY SDK] Validation forcée pour ${feature} (ID: ${customId})`,
    );

    // On simule un événement de succès pour le dispatcher global
    await dispatchPayment({
      provider: "feexpay",
      status: "success",
      feature: feature, // "marketplace", "course" ou "fm-metrix"
      transactionId: reference || "SDK_FORCE_VALIDATION",
      meta: {
        orderId: feature === "marketplace" ? customId : undefined,
        courseOrderId: feature === "course" ? customId : undefined,
        userId: feature === "fm-metrix" ? customId : undefined,
        customId: customId,
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("[FEEXPAY SDK] Erreur validation:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

async function initiateFeexPayTransaction() {
  return { ok: true, url: null, reference: "sdk_feexpay" };
}

module.exports = {
  feexpayWebhookCore,
  initiateFeexPayTransaction,
  verifyFeexPaySDK, // ✅ Export de la nouvelle fonction
};
