// backend/src/routes/admin/services.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Types, isValidObjectId } = mongoose;

const Service = require("../../models/service.model");
const User = require("../../models/user.model");
const ServiceMembership = require("../../models/serviceMembership.model");
const { sendServiceDeletedEmail } = require("../../utils/mailer");
const { verifyAuthHeader } = require("../auth/_helpers");

/* --------------------------- Auth helpers --------------------------- */
function pickReqUser(req) {
  return (
    req.user ||
    req.auth?.user ||
    req.session?.user ||
    req.context?.user ||
    req.currentUser ||
    null
  );
}

async function attachUser(req, _res, next) {
  try {
    if (pickReqUser(req)) return next();
    const { userId, roles, email } = verifyAuthHeader(req);
    if (userId)
      req.user = {
        id: userId,
        roles: Array.isArray(roles) ? roles : [],
        email,
      };
  } catch {}
  next();
}

function requireAuth(req, res, next) {
  const u = pickReqUser(req);
  if (!u?.id && !u?._id) return res.status(401).json({ error: "unauthorized" });
  next();
}

/** ✅ Autorise admin OU agent pour ces routes */
function requireStaff(req, res, next) {
  const roles = Array.isArray(pickReqUser(req)?.roles)
    ? pickReqUser(req).roles
    : [];
  if (!(roles.includes("admin") || roles.includes("agent"))) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

/** Wrapper async */
const a = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** -------- GET /api/admin/services (liste) -------- */
router.get(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    const { q = "", limit = 200, offset = 0 } = req.query;
    const query = {};
    if (q) {
      query.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    }
    const [items, total] = await Promise.all([
      Service.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Math.min(Number(limit), 200)),
      Service.countDocuments(query),
    ]);
    // compat: renvoyer à la fois items et services
    res.json({ items, services: items, total });
  })
);

/** -------- POST /api/admin/services (création) -------- */
router.post(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    let { name, email, role = "", description = "" } = req.body || {};
    name = String(name || "").trim();
    email = String(email || "")
      .trim()
      .toLowerCase();
    role = String(role || "").trim();
    description = String(description || "").trim();

    if (!name || name.length < 2)
      return res.status(400).json({ error: "Nom invalide." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Email invalide." });

    const created = await Service.create({
      name,
      email,
      role,
      description,
      enabled: true,
    });
    res.status(201).json({ service: created });
  })
);

/** -------- PATCH /api/admin/services/:id (update) -------- */
router.patch(
  "/:id",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "id invalide." });

    const payload = {};
    [
      "name",
      "email",
      "role",
      "description",
      "enabled",
      "status",
      "lastCheckAt",
    ].forEach((k) => {
      if (k in req.body) payload[k] = req.body[k];
    });

    if (typeof payload.email === "string") {
      payload.email = payload.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return res.status(400).json({ error: "Email invalide." });
      }
    }
    if (typeof payload.name === "string") {
      payload.name = payload.name.trim();
      if (payload.name.length < 2)
        return res.status(400).json({ error: "Nom invalide." });
    }
    if (payload.role != null) payload.role = String(payload.role || "").trim();
    if (payload.description != null)
      payload.description = String(payload.description || "").trim();

    const updated = await Service.findByIdAndUpdate(id, payload, { new: true });
    if (!updated)
      return res.status(404).json({ error: "Service introuvable." });
    res.json({ service: updated });
  })
);

/** -------- DELETE /api/admin/services/:id (cascade + rétrogradation + email) -------- */
router.delete(
  "/:id",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "id invalide." });

    const svc = await Service.findById(id);
    if (!svc) return res.status(404).json({ error: "Service introuvable." });

    const svcId = new Types.ObjectId(id);

    // 👥 Tous les users affectés par ce service
    const affectedUserIds = await ServiceMembership.distinct("userId", {
      serviceId: svcId,
    });

    // ❌ Supprimer les memberships de ce service
    const delRes = await ServiceMembership.deleteMany({ serviceId: svcId });

    // 🗑️ Supprimer le service
    await Service.deleteOne({ _id: svcId });

    let demoted = [];
    if (affectedUserIds.length) {
      // Reste-t-il d'autres affectations pour ces users ?
      const counts = await ServiceMembership.aggregate([
        { $match: { userId: { $in: affectedUserIds } } },
        { $group: { _id: "$userId", c: { $sum: 1 } } },
      ]);

      const countsMap = new Map(counts.map((r) => [String(r._id), r.c]));
      demoted = affectedUserIds
        .map(String)
        .filter((uid) => !countsMap.get(uid) || countsMap.get(uid) === 0);

      if (demoted.length) {
        await User.updateMany(
          { _id: { $in: demoted } },
          { $pull: { roles: "agent" } }
        );
      }

      // 📬 Notifier tous les utilisateurs impactés (non bloquant)
      const users = await User.find({ _id: { $in: affectedUserIds } })
        .select({ email: 1, fullName: 1 })
        .lean();

      Promise.allSettled(
        users.map((u) =>
          sendServiceDeletedEmail({
            to: u.email,
            fullName: u.fullName,
            serviceName: svc.name || "Service",
            wasDemoted: demoted.includes(String(u._id)),
          })
        )
      ).catch((e) =>
        console.error("mail fail (service delete):", e?.message || e)
      );
    }

    res.json({
      ok: true,
      removedMemberships: delRes.deletedCount || 0,
      demoted, // liste des userIds rétrogradés car plus aucun service
    });
  })
);

module.exports = router;
