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

// ✅ IMPORT DE LA FONCTION DE NOTIFICATION
const { createNotif } = require("../../utils/notifications");

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
   POST /:id/approve - Validation Crypto
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

      // Récupération de l'ordre pour avoir l'utilisateur cible
      const order = await Order.findById(id);
      if (!order)
        return res.status(404).json({ ok: false, error: "Introuvable" });

      // Update des infos crypto
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
      await handleMarketplacePaymentEvent({
        status: "success",
        meta: { orderId: id },
      });

      // 🔔 NOTIFICATION ACHETEUR (Succès)
      if (order.user) {
        await createNotif({
          userId: String(order.user),
          kind: "marketplace_purchase_made", // Code existant côté front
          payload: {
            orderId: id,
            message: `✅ Bonne nouvelle ! Votre paiement crypto de ${order.totalAmount} ${order.currency.toUpperCase()} a été validé. Vos produits sont disponibles.`,
          },
        }).catch((err) => console.warn("Erreur notif approval:", err));
      }

      return res.json({
        ok: true,
        data: { order: { ...order.toObject(), status: "succeeded" } },
      });
    } catch (e) {
      console.error("Approve error:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  },
);

/* ============================================================
   POST /:id/reject - Rejet Crypto
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

      // ✅ MAIL REFUS
      if (order.user?.email) {
        await Mailer.sendMarketplaceCryptoRejectedEmail({
          to: order.user.email,
          fullName: order.user.profile?.fullName || order.user.name || "Client",
          productTitle: order.items?.[0]?.title || "Commande Marketplace",
          reason,
        }).catch((err) => console.error("Mail error:", err));
      }

      // 🔔 NOTIFICATION ACHETEUR (Refus avec motif)
      if (order.user) {
        await createNotif({
          userId: String(order.user._id),
          kind: "marketplace_payment_rejected", // Type générique, le frontend affichera le message brut (parfait pour les refus libres)
          payload: {
            orderId: id,
            message: `❌ Votre paiement crypto a été refusé. Motif : ${reason}`,
          },
        }).catch((err) => console.warn("Erreur notif rejection:", err));
      }

      return res.json({ ok: true, data: { order } });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  },
);

module.exports = router;
