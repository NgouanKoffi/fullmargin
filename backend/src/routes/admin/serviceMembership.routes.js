// backend/src/routes/admin/service-memberships.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Types, isValidObjectId } = mongoose;

const User = require("../../models/user.model");
const Service = require("../../models/service.model");
const ServiceMembership = require("../../models/serviceMembership.model");
const { sendMembershipUpdateEmail } = require("../../utils/mailer");
const { verifyAuthHeader } = require("../auth/_helpers");

/* ------------------------- Auth helpers ------------------------- */
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

/** ✅ Autorise admin OU agent */
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

/**
 * POST /api/admin/service-memberships
 * Body: { userId: string, serviceIds: string[] }
 * Remplace les affectations d’un user par la liste fournie
 * + met à jour son rôle "agent" (add/remove)
 * + envoie un email récapitulatif.
 */
router.post(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    let { userId, serviceIds } = req.body || {};
    if (!userId || !Array.isArray(serviceIds)) {
      return res
        .status(400)
        .json({ error: "Champs requis : { userId, serviceIds[] }" });
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "userId invalide." });
    }

    const userObjId = new Types.ObjectId(String(userId));

    // 👤 User avant modifs
    const user = await User.findById(userObjId)
      .select({ email: 1, fullName: 1, roles: 1 })
      .lean();
    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable." });
    const hadAgentBefore =
      Array.isArray(user.roles) && user.roles.includes("agent");

    // 🔎 Normaliser + valider services demandés
    const unique = [...new Set(serviceIds)]
      .filter((id) => typeof id === "string" && isValidObjectId(id))
      .map((id) => String(id));

    const existing = await Service.find({ _id: { $in: unique } })
      .select({ _id: 1 })
      .lean();
    const existingSet = new Set(existing.map((s) => String(s._id)));
    const validIds = unique.filter((id) => existingSet.has(id));

    // 💾 ÉTAT AVANT (pour delta)
    const prevMemberships = await ServiceMembership.find({ userId: userObjId })
      .select({ serviceId: 1 })
      .lean();
    const prevIds = new Set(prevMemberships.map((m) => String(m.serviceId)));

    // ➕➖ Delta
    const nextSet = new Set(validIds);
    const addedIds = [...nextSet].filter((id) => !prevIds.has(id));
    const removedIds = [...prevIds].filter((id) => !nextSet.has(id));

    // 🧾 Noms des services impactés
    const impactIds = [...new Set([...addedIds, ...removedIds])];
    const impactSvcs = impactIds.length
      ? await Service.find({ _id: { $in: impactIds } })
          .select({ _id: 1, name: 1 })
          .lean()
      : [];
    const nameById = new Map(
      impactSvcs.map((s) => [String(s._id), s.name || "Service"])
    );
    const addedNames = addedIds.map((id) => nameById.get(id) || "Service");
    const removedNames = removedIds.map((id) => nameById.get(id) || "Service");

    // 🔄 Remplacer toutes les affectations
    await ServiceMembership.deleteMany({ userId: userObjId });

    let inserted = [];
    if (validIds.length) {
      inserted = await ServiceMembership.insertMany(
        validIds.map((sid) => ({
          userId: userObjId,
          serviceId: new Types.ObjectId(sid),
          since: new Date(),
        })),
        { ordered: false }
      );
    }

    // 🏷️ Mettre à jour le rôle "agent"
    if (validIds.length > 0) {
      await User.updateOne(
        { _id: userObjId },
        { $addToSet: { roles: "agent" } }
      );
    } else {
      await User.updateOne({ _id: userObjId }, { $pull: { roles: "agent" } });
    }
    const isAgentNow = validIds.length > 0;
    const becameAgent = !hadAgentBefore && isAgentNow;
    const lostAgent = hadAgentBefore && !isAgentNow;

    // 📬 Email (non bloquant)
    sendMembershipUpdateEmail({
      to: user.email,
      fullName: user.fullName,
      addedNames,
      removedNames,
      becameAgent,
      lostAgent,
    }).catch((e) => console.error("mail fail (membership):", e?.message || e));

    res.json({
      ok: true,
      memberships: inserted.map((m) => ({
        id: String(m._id),
        userId: String(m.userId),
        serviceId: String(m.serviceId),
        since:
          m.since instanceof Date ? m.since.toISOString() : String(m.since),
      })),
      delta: { added: addedIds, removed: removedIds },
      role: { becameAgent, lostAgent, isAgentNow },
    });
  })
);

/**
 * GET /api/admin/service-memberships
 * Query (optionnels): userId, serviceId
 */
router.get(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (req, res) => {
    const { userId, serviceId } = req.query || {};
    const q = {};
    if (userId) {
      if (!isValidObjectId(userId))
        return res.status(400).json({ error: "userId invalide." });
      q.userId = new Types.ObjectId(String(userId));
    }
    if (serviceId) {
      if (!isValidObjectId(serviceId))
        return res.status(400).json({ error: "serviceId invalide." });
      q.serviceId = new Types.ObjectId(String(serviceId));
    }
    const memberships = await ServiceMembership.find(q)
      .select({ userId: 1, serviceId: 1, since: 1 })
      .lean();
    res.json({
      memberships: memberships.map((m) => ({
        userId: String(m.userId),
        serviceId: String(m.serviceId),
        since: m.since ? new Date(m.since).toISOString() : null,
      })),
    });
  })
);

/**
 * GET /api/admin/service-memberships/summary
 * Agrégation par service: { serviceId, name, email, count, last }
 */
router.get(
  "/summary",
  attachUser,
  requireAuth,
  requireStaff,
  a(async (_req, res) => {
    const agg = await ServiceMembership.aggregate([
      {
        $group: {
          _id: "$serviceId",
          count: { $sum: 1 },
          last: { $max: "$since" },
        },
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "svc",
        },
      },
      {
        $project: {
          _id: 0,
          serviceId: { $toString: "$_id" },
          count: 1,
          last: 1,
          name: {
            $ifNull: [{ $arrayElemAt: ["$svc.name", 0] }, "Service manquant"],
          },
          email: { $ifNull: [{ $arrayElemAt: ["$svc.email", 0] }, "—"] },
        },
      },
    ]);

    res.json({
      summary: agg.map((r) => ({
        serviceId: String(r.serviceId),
        name: r.name,
        email: r.email,
        count: typeof r.count === "number" ? r.count : 0,
        last: r.last ? new Date(r.last).toISOString() : null,
      })),
    });
  })
);

module.exports = router;
