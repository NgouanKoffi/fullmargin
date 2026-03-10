// backend/src/routes/payments/features/fmmetrix/stripe.webhook.js
const FmMetrix = require("../../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../../models/fmmetrixSubscription.model");
const FmMetrixNotifier = require("../../../../services/fmmetrixNotifier.service");

async function handleFmMetrixStripeEvent({ stripe, event, object }) {
  if (!stripe || !event) return;

  try {
    // 🛑 ECHEC DU PRELEVEMENT AUTOMATIQUE
    if (event.type === "invoice.payment_failed") {
      const subscriptionId = object.subscription; // L'ID de l'abonnement Stripe (ex: sub_12345)

      if (subscriptionId) {
        // Trouver l'abonnement dans notre base de données via l'ID Stripe
        const sub = await FmMetrixSubscription.findOne({
          stripeSubscriptionId: subscriptionId,
        }).lean();

        if (sub) {
          const userId = sub.userId;
          const now = new Date();

          // 1. Couper l'accès global de l'utilisateur
          await FmMetrix.updateOne(
            { userId },
            { $set: { validUntil: now, "raw.status": "payment_failed" } },
          );

          // 2. Mettre le statut de cet abonnement spécifique à "failed"
          await FmMetrixSubscription.updateOne(
            { _id: sub._id },
            { $set: { status: "failed", periodEnd: now } },
          );

          // 3. Envoyer l'email d'interruption
          await FmMetrixNotifier.notifyCanceled({
            userId: String(userId),
            endedAt: now,
            reason:
              "Échec du prélèvement automatique sur votre carte bancaire. Veuillez mettre à jour votre moyen de paiement ou vous réabonner.",
            dedupeKey: `failed:${object.id}`,
          });

          console.log(
            `[Stripe Webhook] Abonnement FM Metrix interrompu suite à un échec de paiement (Invoice: ${object.id})`,
          );
        }
      }
    }

    // (Optionnel) : Si tu gères aussi "invoice.paid" pour les renouvellements réussis ici
    // else if (event.type === "invoice.paid") { ... }
  } catch (e) {
    console.error("[STRIPE][FMMETRIX] webhook handler error:", e?.message || e);
  }
}

module.exports = { handleFmMetrixStripeEvent };
