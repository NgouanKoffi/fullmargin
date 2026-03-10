// backend/src/routes/admin/marketplace.orders.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../../models/order.model");
const User = require("../../models/user.model");
const { verifyAuthHeader } = require("../auth/_helpers");
const Mailer = require("../../utils/mailer");
const {
  handleMarketplacePaymentEvent,
} = require("../payments/handlers/marketplace.handler");

// ✅ IMPORT DE LA FONCTION DE NOTIFICATION IN-APP
const { createNotif } = require("../../utils/notifications");

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: String(a.userId) };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
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
    return res.status(500).json({ ok: false });
  }
}

function buildQueryByStatus(statuses, q) {
  const query = { deletedAt: null, status: { $in: statuses } };
  const s = String(q || "").trim();
  if (s) {
    if (mongoose.Types.ObjectId.isValid(s) && s.length === 24) query._id = s;
    else
      query["items.title"] = {
        $regex: s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
  }
  return query;
}

router.get("/pending", requireAuth, requireAdminOrAgent, async (req, res) => {
  try {
    const rows = await Order.find(
      buildQueryByStatus(["requires_payment"], req.query.q),
    )
      .sort({ createdAt: -1 })
      .populate("user", "email name")
      .lean();
    return res.json({ ok: true, data: { items: rows } });
  } catch {
    return res.status(500).json({ ok: false });
  }
});

router.get("/paid", requireAuth, requireAdminOrAgent, async (req, res) => {
  try {
    const rows = await Order.find(
      buildQueryByStatus(["succeeded"], req.query.q),
    )
      .sort({ createdAt: -1 })
      .populate("user", "email name")
      .lean();
    return res.json({ ok: true, data: { items: rows } });
  } catch {
    return res.status(500).json({ ok: false });
  }
});

router.get("/closed", requireAuth, requireAdminOrAgent, async (req, res) => {
  try {
    const rows = await Order.find(
      buildQueryByStatus(["canceled", "failed"], req.query.q),
    )
      .sort({ createdAt: -1 })
      .populate("user", "email name")
      .lean();
    return res.json({ ok: true, data: { items: rows } });
  } catch {
    return res.status(500).json({ ok: false });
  }
});

// ✅ VALIDATE : NETTOYÉ (Plus de doublon de mail) + NOTIFICATION IN-APP
router.post(
  "/:id/validate",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const order = await Order.findById(id); // Récupéré pour avoir le userID pour la notif
      if (!order)
        return res.status(404).json({ ok: false, error: "Introuvable" });

      // On délègue tout au handler verrouillé (il s'occupe des e-mails, commissions, etc.)
      await handleMarketplacePaymentEvent({
        status: "success",
        meta: { orderId: id },
      });

      // 🔔 NOTIFICATION IN-APP POUR L'ACHETEUR : Validation réussie
      if (order.user) {
        await createNotif({
          userId: String(order.user),
          kind: "marketplace_purchase_made", // Code existant et reconnu côté front
          payload: {
            orderId: id,
            productTitle: order.items?.[0]?.title || "Commande Marketplace",
            message: `✅ Votre paiement a été validé ! Vous pouvez maintenant accéder à vos produits.`,
          },
        }).catch((err) => console.warn("Erreur notif validate order:", err));
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("[admin validate]", e);
      return res.status(500).json({ ok: false, error: "Erreur" });
    }
  },
);

// ✅ CANCEL : EMAIL ICI + NOTIFICATION IN-APP
router.post(
  "/:id/cancel",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const { reason } = req.body;
      const finalReason = reason || "Annulée par l'admin";

      const order = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "canceled",
            "crypto.status": "rejected",
            "crypto.rejectedAt": new Date(),
            "crypto.rejectReason": finalReason,
          },
        },
        { new: true },
      ).populate("user", "email name profile");

      if (!order) return res.status(404).json({ ok: false });

      // 📧 ENVOI DE L'EMAIL
      if (order.user?.email) {
        await Mailer.sendMarketplaceCryptoRejectedEmail({
          to: order.user.email,
          fullName: order.user.profile?.fullName || order.user.name || "Client",
          productTitle: order.items?.[0]?.title || "Commande",
          reason: finalReason,
        }).catch(console.error);
      }

      // 🔔 NOTIFICATION IN-APP POUR L'ACHETEUR : Refus avec motif
      if (order.user?._id) {
        await createNotif({
          userId: String(order.user._id),
          kind: "marketplace_payment_rejected", // Type générique, le frontend l'affichera directement
          payload: {
            orderId: id,
            productTitle: order.items?.[0]?.title || "Commande",
            message: `❌ Votre commande a été refusée. Motif : ${finalReason}`,
          },
        }).catch((err) => console.warn("Erreur notif cancel order:", err));
      }

      return res.json({ ok: true, data: { order } });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  },
);

module.exports = router;
