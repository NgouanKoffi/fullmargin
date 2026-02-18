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

// ✅ VALIDATE : NETTOYÉ (Plus de doublon de mail)
router.post(
  "/:id/validate",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const exists = await Order.exists({ _id: id });
      if (!exists)
        return res.status(404).json({ ok: false, error: "Introuvable" });

      // On délègue tout au handler verrouillé
      await handleMarketplacePaymentEvent({
        status: "success",
        meta: { orderId: id },
      });

      return res.json({ ok: true });
    } catch (e) {
      console.error("[admin validate]", e);
      return res.status(500).json({ ok: false, error: "Erreur" });
    }
  },
);

// ✅ CANCEL : EMAIL ICI
router.post(
  "/:id/cancel",
  requireAuth,
  requireAdminOrAgent,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const { reason } = req.body;

      const order = await Order.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            status: "canceled",
            "crypto.status": "rejected",
            "crypto.rejectedAt": new Date(),
            "crypto.rejectReason": reason || null,
          },
        },
        { new: true },
      ).populate("user", "email name profile");

      if (!order) return res.status(404).json({ ok: false });

      if (order.user?.email) {
        await Mailer.sendMarketplaceCryptoRejectedEmail({
          to: order.user.email,
          fullName: order.user.profile?.fullName || order.user.name || "Client",
          productTitle: order.items?.[0]?.title || "Commande",
          reason: reason || "Annulée par l'admin",
        }).catch(console.error);
      }

      return res.json({ ok: true, data: { order } });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  },
);

module.exports = router;
