// backend/src/routes/admin/marketplace.crypto.orders.js
const express = require("express");
const router = express.Router();
const Order = require("../../models/order.model");
const User = require("../../models/user.model");
const { verifyAuthHeader } = require("../auth/_helpers");
const Mailer = require("../../utils/mailer");
const {
  handleMarketplacePaymentEvent,
} = require("../payments/handlers/marketplace.handler");

// ... (Garde tes fonctions requireAuth, requireAdminOrAgent, buildCryptoFilter inchangées) ...
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) return res.status(401).json({ ok: false });
    req.auth = { userId: String(a.userId) };
    next();
  } catch {
    return res.status(401).json({ ok: false });
  }
}
async function requireAdminOrAgent(req, res, next) {
  try {
    const me = await User.findById(req.auth.userId).select("roles").lean();
    const roles = Array.isArray(me?.roles) ? me.roles : [];
    if (!roles.includes("admin") && !roles.includes("agent"))
      return res.status(403).json({ ok: false });
    next();
  } catch {
    return res.status(403).json({ ok: false });
  }
}
function buildCryptoFilter() {
  return {
    $or: [
      { provider: "crypto" },
      {
        $and: [
          { "stripe.checkoutSessionId": null },
          { paymentReference: { $ne: "" } },
        ],
      },
    ],
  };
}

router.get("/pending", requireAuth, requireAdminOrAgent, async (req, res) => {
  try {
    const orders = await Order.find({
      status: "requires_payment",
      ...buildCryptoFilter(),
    })
      .sort({ createdAt: -1 })
      .populate("user", "email profile")
      .lean();
    const items = orders.map((o) => ({
      id: String(o._id),
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      paymentReference: o.paymentReference || o.crypto?.txHash || "",
      buyer: {
        email: o.user?.email,
        name: o.user?.profile?.fullName || "Inconnu",
      },
      crypto: o.crypto,
    }));
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
});

/* ============================================================
   POST /:id/approve - NETTOYÉ : PLUS D'ENVOI DE MAIL ICI
============================================================ */
router.post(
  "/:id/approve",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const note = req.body?.note;
      const txHash = req.body?.txHash;

      // On update juste les infos crypto (optionnel mais bien pour la trace)
      // IMPORTANT : On NE TOUCHE PAS au statut ici si possible, ou on le met, mais le handler a son verrou.
      // Le mieux est de laisser le handler faire le switch final, mais pour l'UX admin on peut update les métadonnées.
      await Order.updateOne(
        { _id: id },
        {
          $set: {
            "crypto.status": "approved",
            "crypto.approvedAt": new Date(),
            "crypto.txHash": txHash,
            "crypto.note": note,
          },
        },
      );

      // ✅ ON DÉCLENCHE LE HANDLER
      // C'est LUI qui va passer le status à 'succeeded', envoyer les mails et livrer.
      // Grâce au verrouillage atomique, il ne le fera qu'une seule fois.
      await handleMarketplacePaymentEvent({
        status: "success",
        meta: { orderId: id },
      });

      return res.json({ ok: true });
    } catch (e) {
      console.error("Approve error:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  },
);

/* ============================================================
   POST /:id/reject - GARDE L'ENVOI DE MAIL (Car le handler ne gère pas les refus)
============================================================ */
router.post(
  "/:id/reject",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const reason = req.body?.reason || "Paiement non reçu";

      const order = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "failed",
            "crypto.status": "rejected",
            "crypto.rejectedAt": new Date(),
            "crypto.rejectionReason": reason,
          },
        },
        { new: true },
      ).populate("user", "email profile name");

      if (!order) return res.status(404).json({ ok: false });

      // ✅ MAIL REFUS (Géré ici)
      if (order.user?.email) {
        await Mailer.sendMarketplaceCryptoRejectedEmail({
          to: order.user.email,
          fullName: order.user.profile?.fullName || order.user.name || "Client",
          productTitle: order.items?.[0]?.title || "Commande",
          reason,
        }).catch((err) => console.error("Mail error:", err));
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  },
);

module.exports = router;
