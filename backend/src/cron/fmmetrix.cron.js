// backend/src/cron/fmmetrix.cron.js
"use strict";

const cron = require("node-cron");
const FmMetrix = require("../models/fmmetrix.model");
const FmMetrixSubscription = require("../models/fmmetrixSubscription.model");
const FmMetrixNotifier = require("../services/fmmetrixNotifier.service");

/**
 * Tâche automatisée (tous les jours à 08h00)
 */
async function checkExpiringSubscriptions() {
  console.log(
    "[CRON] Démarrage de la vérification des abonnements FM Metrix...",
  );

  const now = new Date();

  // =========================================================================
  // 1. PREVENTION A J-3
  // =========================================================================
  const targetStart = new Date(now);
  targetStart.setDate(targetStart.getDate() + 3);
  targetStart.setHours(0, 0, 0, 0);

  const targetEnd = new Date(targetStart);
  targetEnd.setHours(23, 59, 59, 999);

  try {
    const expiringIn3Days = await FmMetrix.find({
      validUntil: { $gte: targetStart, $lte: targetEnd },
      "raw.autoRenew": { $ne: false }, // On ne relance pas ceux qui ont déjà résilié
    }).lean();

    let warnedCount = 0;
    for (const doc of expiringIn3Days) {
      await FmMetrixNotifier.notifyExpiringSoon({
        userId: String(doc.userId),
        validUntil: doc.validUntil,
        daysLeft: 3,
        dedupeKey: `expire_warn_3d:${doc.userId}:${new Date(doc.validUntil).toISOString().slice(0, 10)}`,
      });
      warnedCount++;
    }
    console.log(`[CRON] ${warnedCount} rappels J-3 envoyés.`);
  } catch (err) {
    console.error("[CRON] Erreur lors de la vérification J-3 :", err);
  }

  // =========================================================================
  // 2. EXPIRATION LE JOUR J (Passage en inactif)
  // =========================================================================
  try {
    // On cherche les abonnements qui sont dépassés depuis hier/aujourd'hui et toujours marqués "actifs" dans l'historique
    const expiredDocs = await FmMetrixSubscription.find({
      periodEnd: { $lt: now },
      status: "active",
    }).lean();

    let expiredCount = 0;

    for (const sub of expiredDocs) {
      const uId = sub.userId;

      // On vérifie si l'utilisateur n'a pas un NOUVEL abonnement actif globalement
      const globalDoc = await FmMetrix.findOne({ userId: uId }).lean();
      if (globalDoc && new Date(globalDoc.validUntil) > now) {
        // Il a renouvelé entre-temps, on met juste à jour l'ancien sous-document à "expired" sans envoyer de mail
        await FmMetrixSubscription.updateOne(
          { _id: sub._id },
          { $set: { status: "expired" } },
        );
        continue;
      }

      // S'il n'a vraiment plus d'abonnement valide, on coupe tout et on envoie le mail !
      await FmMetrixSubscription.updateOne(
        { _id: sub._id },
        { $set: { status: "expired" } },
      );

      // On envoie le mail d'expiration issu de ton mailer.js (fmmetrix.subscription_expired)
      await FmMetrixNotifier.notifyExpired({
        userId: String(uId),
        validUntil: sub.periodEnd,
        dedupeKey: `expired_day_j:${sub._id}`,
      });

      expiredCount++;
    }

    console.log(
      `[CRON] ${expiredCount} abonnements ont expiré et ont été clôturés.`,
    );
  } catch (err) {
    console.error("[CRON] Erreur lors du traitement des expirations :", err);
  }
}

/**
 * Fonction d'initialisation à appeler dans app.js
 */
function startFmMetrixCron() {
  cron.schedule("0 8 * * *", () => {
    checkExpiringSubscriptions();
  });
  console.log("[jobs] fmmetrix.cron programmé (tous les jours à 08:00)");
}

module.exports = { startFmMetrixCron, checkExpiringSubscriptions };
