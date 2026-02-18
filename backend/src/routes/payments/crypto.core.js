// backend/src/routes/payments/crypto.core.js
const mongoose = require("mongoose");
// Assure-toi que le chemin vers ton model est correct
const FmMetrixSubscription = require("../../models/fmmetrixSubscription.model");

/**
 * SERVICE: Création de l'intention de paiement Crypto (Manuel)
 * - Crée une entrée en BDD avec statut "pending_crypto"
 * - Retourne la référence à afficher sur WhatsApp
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
    // Format: REF-{TIMESTAMP}-{RANDOM}
    const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Création selon le "feature" (ici focus sur fm-metrix comme demandé)
    if (feature === "fm-metrix") {
      // On vérifie s'il a déjà un abonnement en attente pour éviter les doublons ?
      // Optionnel, ici on autorise plusieurs tentatives.

      const newSubscription = new FmMetrixSubscription({
        userId: userId,
        status: "pending_crypto", // ✅ Le statut clé pour ton Dashboard Admin
        periodStart: startDate,
        periodEnd: endDate,

        // On utilise les champs stripeCustomerId/Id pour stocker nos infos manuelles
        stripeCustomerId: "MANUAL_CRYPTO",
        stripeSubscriptionId: reference, // On stocke la REF ici pour la retrouver facilement

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

      return res.status(201).json({
        ok: true,
        reference: reference,
        amount: amount,
        network: network,
        id: newSubscription._id,
      });
    }

    // Si on veut gérer d'autres features plus tard (Marketplace, Cours...)
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
