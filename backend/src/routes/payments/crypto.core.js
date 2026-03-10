// backend/src/routes/payments/crypto.core.js
const mongoose = require("mongoose");
const FmMetrixSubscription = require("../../models/fmmetrixSubscription.model");
const User = require("../../models/user.model"); // ✅ Import du modèle User
const { createNotif } = require("../../utils/notifications"); // ✅ Import des notifications

/**
 * SERVICE: Création de l'intention de paiement Crypto (Manuel)
 * - Crée une entrée en BDD avec statut "pending_crypto"
 * - Retourne la référence à afficher sur WhatsApp
 * - ✅ Envoie une notification aux admins
 */
async function createManualCryptoIntent(req, res) {
  try {
    const userId = req.auth?.userId || req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ ok: false, message: "Utilisateur non identifié" });
    }

    const { network, amount, feature } = req.body; // ex: "BEP20", 29, "fm-metrix"

    // 1. Validation basique
    if (!amount || amount <= 0) {
      return res.status(400).json({ ok: false, message: "Montant invalide" });
    }

    // 2. Calcul des dates (Activation théorique +30 jours, sera confirmé par l'admin)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // 3. Génération d'une référence unique pour le virement
    const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Création selon le "feature" (ici focus sur fm-metrix)
    if (feature === "fm-metrix") {
      const newSubscription = new FmMetrixSubscription({
        userId: userId,
        status: "pending_crypto",
        periodStart: startDate,
        periodEnd: endDate,
        stripeCustomerId: "MANUAL_CRYPTO",
        stripeSubscriptionId: reference,
        raw: {
          provider: "manual_crypto",
          network: network || "Unknown",
          coin: "USDT",
          declaredAmount: amount,
          note: "En attente de preuve WhatsApp",
        },
      });

      await newSubscription.save();
      console.log(
        `[CRYPTO] Nouvelle demande créée: ${reference} par user ${userId}`,
      );

      // 🔔 ✅ NOTIFICATION AUX ADMINISTRATEURS
      try {
        const requester = await User.findById(userId)
          .select("name profile email")
          .lean();
        const requesterName =
          requester?.profile?.fullName ||
          requester?.name ||
          requester?.email ||
          "Un utilisateur";

        const admins = await User.find({ roles: "admin" }).select("_id").lean();
        const adminPromises = admins.map((admin) =>
          createNotif({
            userId: String(admin._id),
            kind: "admin_fmmetrix_crypto_pending",
            payload: {
              userName: requesterName,
              amount: `${amount} USDT`,
              reference: reference,
              message: `${requesterName} a demandé un abonnement FM Metrix payé en Crypto (${amount} USDT).`,
            },
          }),
        );
        await Promise.allSettled(adminPromises);
      } catch (adminNotifError) {
        console.error(
          "[CRYPTO] Erreur envoi notif admin FM Metrix:",
          adminNotifError,
        );
      }

      return res.status(201).json({
        ok: true,
        reference: reference,
        amount: amount,
        network: network,
        id: newSubscription._id,
      });
    }

    return res
      .status(400)
      .json({ ok: false, message: "Feature non supportée pour le moment" });
  } catch (err) {
    console.error("[CRYPTO] Erreur createManualCryptoIntent:", err);
    return res.status(500).json({
      ok: false,
      message: "Erreur serveur lors de la création de la commande crypto",
      error: err.message,
    });
  }
}

module.exports = {
  createManualCryptoIntent,
};
