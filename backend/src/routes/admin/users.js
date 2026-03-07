// backend/src/routes/admin/users.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = require("../../models/user.model");
const ArchivedUser = require("../../models/archivedUser.model");
const ProfileExtra = require("../../models/profileExtra.model");
const Presence = require("../../models/presence.model");
const PresenceSession = require("../../models/presenceSession.model");
const UserAudit = require("../../models/userAudit.model");

// pour détecter les proprios de communautés / boutiques
const Community = require("../../models/community.model");
const Shop = require("../../models/shop.model");

// ✅ Imports pour les notifications et emails
const { createNotif } = require("../../utils/notifications");
const {
  sendAdminPromotionEmail,
  sendAdminDemotionEmail,
} = require("../../utils/mailer");

const { verifyAuthHeader } = require("../auth/_helpers");

/* ======================= CONST ======================= */
const EXCLUDED_ROLES = ["agent", "admin"];

// ✅ Liste de correspondance pour transformer les slugs en noms propres dans l'email
const PERMISSIONS_LABELS = {
  visites: "Gestion des Visites",
  utilisateurs: "Gestion des Utilisateurs",
  permissions: "Accord d'accès (Permissions)",
  fullmetrix: "Accès Full Metrix",
  communautes: "Gestion des Communautés",
  retraits: "Gestion des Retraits/Wallet",
  messages: "Emails et Messages",
  podcasts: "Gestion des Podcasts",
  marketplace: "Gestion Marketplace",
  "marketplace-crypto": "Marketplace Crypto",
};

// ✅ NOUVEAU : Mapping pour le lien de redirection dynamique dans l'email
const PERMISSIONS_PATHS = {
  visites: "/admin/visites",
  utilisateurs: "/admin/utilisateurs",
  permissions: "/admin/permissions",
  fullmetrix: "/admin/fullmetrix",
  communautes: "/admin/communautes",
  retraits: "/admin/wallet/withdrawals",
  messages: "/admin/messages",
  podcasts: "/admin/podcasts",
  marketplace: "/admin/marketplace",
  "marketplace-crypto": "/admin/marketplace-crypto",
};

/* ======================= AUTH ROBUSTE ======================= */
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

async function attachUserFromHeaderIfNeeded(req) {
  if (pickReqUser(req)) return;
  const { userId, roles, email } = verifyAuthHeader(req);
  if (!userId) return;
  req.user = { id: userId, roles: Array.isArray(roles) ? roles : [], email };
}

async function maybeHydrateUserRoles(u) {
  if (!u) return null;
  if (Array.isArray(u.roles) && u.roles.length) return u;
  const id = u._id || u.id;
  if (!id) return u;
  const fresh = await User.findById(id).select("roles").lean();
  if (fresh?.roles) u.roles = fresh.roles;
  return u;
}

async function requireAuth(req, res, next) {
  try {
    await attachUserFromHeaderIfNeeded(req);
    const u = pickReqUser(req);
    if (!u) return res.status(401).json({ error: "unauthorized" });
    if (!u.id && u._id) u.id = String(u._id);
    req.user = u;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

/** Autorise admin OU agent */
async function requireStaff(req, res, next) {
  try {
    const u = await maybeHydrateUserRoles(req.user);
    const roles = Array.isArray(u?.roles) ? u.roles : [];
    if (!(roles.includes("admin") || roles.includes("agent"))) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  } catch {
    return res.status(403).json({ error: "forbidden" });
  }
}

/* ======================= UTILS ======================= */
function parseRange(req) {
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(Date.now() - 7 * 864e5);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const fromIso = new Date(new Date(from).setHours(0, 0, 0, 0));
  const toIso = new Date(new Date(to).setHours(23, 59, 59, 999));
  return { from: fromIso, to: toIso };
}
function dayKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

/* ======================= ROUTES : LISTE ACTIVE ======================= */

/**
 * GET /admin/users
 * Query: q? role? limit? before? beforeId?
 */
router.get("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const meId = String(req.user._id || req.user.id);
    const meObjId = new mongoose.Types.ObjectId(meId);

    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").trim();

    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const beforeIdRaw = String(req.query.beforeId || "").trim();
    const beforeId =
      beforeIdRaw && mongoose.Types.ObjectId.isValid(beforeIdRaw)
        ? new mongoose.Types.ObjectId(beforeIdRaw)
        : null;

    const baseAnd = [{ _id: { $ne: meObjId } }];

    if (q) {
      baseAnd.push({
        $or: [
          { fullName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      });
    }

    if (role) {
      baseAnd.push({ roles: { $in: [role] } });
    }

    const matchForCount = baseAnd.length > 1 ? { $and: baseAnd } : baseAnd[0];

    const andWithCursor = [...baseAnd];
    if (before) {
      if (beforeId) {
        andWithCursor.push({
          $or: [
            { createdAt: { $lt: before } },
            { createdAt: before, _id: { $lt: beforeId } },
          ],
        });
      } else {
        andWithCursor.push({ createdAt: { $lt: before } });
      }
    }
    const matchForPage =
      andWithCursor.length > 1 ? { $and: andWithCursor } : andWithCursor[0];

    const total = await User.countDocuments(matchForCount);

    const data = await User.aggregate([
      { $match: matchForPage },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: "profileextras",
          localField: "_id",
          foreignField: "user",
          as: "extra",
        },
      },
      { $addFields: { extra: { $first: "$extra" } } },
      {
        $lookup: {
          from: "presences",
          localField: "_id",
          foreignField: "user",
          as: "presence",
        },
      },
      { $addFields: { presence: { $first: "$presence" } } },
      {
        $project: {
          id: { $toString: "$_id" },
          fullName: 1,
          email: 1,
          avatarUrl: 1,
          roles: 1,
          adminPermissions: 1, // ✅ On renvoie les permissions au front
          isActive: 1,
          createdAt: 1,
          "extra.city": 1,
          "extra.country": 1,
          "presence.status": 1,
          "presence.lastPingAt": 1,
          "presence.lastOnlineAt": 1,
          "presence.totalOnlineMs": 1,
        },
      },
    ]);

    const hasMore = data.length > limit;
    const users = hasMore ? data.slice(0, limit) : data;

    const last = users[users.length - 1] || null;
    const nextCursor =
      hasMore && last ? { before: last.createdAt, beforeId: last.id } : null;

    res.json({ users, total, nextCursor });
  } catch (e) {
    next(e);
  }
});

/* ======================= ROUTE : MODIFIER UN RÔLE + NOTIFICATIONS ======================= */
router.patch("/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    // Vérification que l'acteur est bien admin
    const me = await maybeHydrateUserRoles(req.user);
    if (!me?.roles?.includes("admin")) {
      return res
        .status(403)
        .json({ ok: false, error: "Action réservée aux administrateurs." });
    }

    const { id } = req.params;
    const { roles, adminPermissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "ID invalide." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser)
      return res
        .status(404)
        .json({ ok: false, error: "Utilisateur non trouvé." });

    const wasAdmin = targetUser.roles.includes("admin");
    const isAdminNow = Array.isArray(roles) && roles.includes("admin");

    if (Array.isArray(roles)) {
      targetUser.roles = roles;
    }

    // SAUVEGARDE DES PERMISSIONS
    if (Array.isArray(adminPermissions)) {
      targetUser.adminPermissions = adminPermissions;
    }

    await targetUser.save();

    // ✅ LOGIQUE DE NOTIFICATION ET EMAIL DÉTAILLÉ
    if (isAdminNow) {
      // 1. Construit la liste sous forme de chaîne simple pour éviter les bugs du template
      const listString =
        Array.isArray(adminPermissions) && adminPermissions.length > 0
          ? adminPermissions
              .map(
                (p) =>
                  `<li style="margin-bottom:8px;"><b>${PERMISSIONS_LABELS[p] || p}</b></li>`,
              )
              .join("")
          : `<li><b>Accès standard (Aucune section spécifique assignée)</b></li>`;

      // 2. Trouve le premier chemin pour la redirection dynamique
      const firstSlug =
        Array.isArray(adminPermissions) && adminPermissions.length > 0
          ? adminPermissions[0]
          : null;
      const baseUrl = process.env.FRONTEND_URL || "https://fullmargin.net";
      const redirectLink = firstSlug
        ? `${baseUrl}${PERMISSIONS_PATHS[firstSlug]}`
        : `${baseUrl}/admin`;

      await Promise.allSettled([
        createNotif({
          userId: targetUser._id,
          kind: "admin_role_granted",
          payload: { message: "Vous avez été promu administrateur." },
        }),
        // On passe la chaîne préformatée ET le lien dynamique
        sendAdminPromotionEmail(
          targetUser.email,
          targetUser.fullName,
          listString,
          redirectLink,
        ),
      ]);
    } else if (wasAdmin && !isAdminNow) {
      // Rétrogradation
      await Promise.allSettled([
        createNotif({
          userId: targetUser._id,
          kind: "admin_role_revoked",
          payload: { message: "Vos accès administrateur ont été retirés." },
        }),
        sendAdminDemotionEmail(targetUser.email, targetUser.fullName),
      ]);
    }

    res.json({ ok: true, data: targetUser });
  } catch (e) {
    next(e);
  }
});

/* ======================= ROUTE : TOUS LES EMAILS ======================= */
router.get("/all-emails", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const docs = await User.find({ email: { $ne: null } })
      .select("_id email roles")
      .lean();
    const byId = new Map();
    for (const u of docs) {
      const id = String(u._id);
      const email = String(u.email || "")
        .trim()
        .toLowerCase();
      if (email) byId.set(id, email);
    }

    const all = new Set();
    const agents = new Set();
    const communityOwners = new Set();
    const shopOwners = new Set();

    for (const u of docs) {
      const email = byId.get(String(u._id));
      if (!email) continue;
      all.add(email);
      if (Array.isArray(u.roles) && u.roles.includes("agent"))
        agents.add(email);
    }

    const communityOwnerIds = await Community.distinct("ownerId", {
      deletedAt: null,
      isActive: true,
    });
    for (const id of communityOwnerIds) {
      const email = byId.get(String(id));
      if (email) {
        communityOwners.add(email);
        all.add(email);
      }
    }

    const shopOwnerIds = await Shop.distinct("user", { deletedAt: null });
    for (const id of shopOwnerIds) {
      const email = byId.get(String(id));
      if (email) {
        shopOwners.add(email);
        all.add(email);
      }
    }

    res.json({
      totalUsers: docs.length,
      emails: Array.from(all),
      agentEmails: Array.from(agents),
      communityOwnerEmails: Array.from(communityOwners),
      shopOwnerEmails: Array.from(shopOwners),
    });
  } catch (e) {
    next(e);
  }
});

/* ======================= ARCHIVER / RESTAURER ======================= */
router.post(
  "/:id/archive",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: "invalid_id" });
      const user = await User.findById(id).select("+passwordHash").lean();
      if (!user) return res.status(404).json({ error: "not_found" });
      const reason = String(req.body?.reason || "").trim();

      await ArchivedUser.create({
        originalUserId: user._id,
        originalCreatedAt: user.createdAt,
        originalUpdatedAt: user.updatedAt,
        fullName: user.fullName,
        email: user.email,
        passwordHash: user.passwordHash,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        roles: user.roles,
        isActive: user.isActive,
        localEnabled: user.localEnabled,
        googleId: user.googleId,
        twoFAEnabled: user.twoFAEnabled,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        archivedAt: new Date(),
        archivedBy: req.user?.id || null,
        reason,
      });
      await User.deleteOne({ _id: id });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/archived", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const q = (req.query.q || "").trim();

    const find = {};
    if (q) {
      find.$or = [
        { fullName: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { reason: new RegExp(q, "i") },
      ];
    }

    const items = await ArchivedUser.find(find)
      .sort({ archivedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      users: items.map((u) => ({
        id: String(u._id),
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl || "",
        archivedAt: u.archivedAt || u.createdAt,
        reason: u.reason || "",
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/archived/:archId/restore",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const archId = req.params.archId;
      if (!mongoose.Types.ObjectId.isValid(archId))
        return res.status(400).json({ error: "invalid_id" });
      const archived = await ArchivedUser.findById(archId)
        .select("+passwordHash")
        .lean();
      if (!archived) return res.status(404).json({ error: "not_found" });
      const existing = await User.findOne({ email: archived.email }).lean();
      if (existing) return res.status(409).json({ error: "email_conflict" });

      const created = await User.create({
        fullName: archived.fullName,
        email: archived.email,
        passwordHash: archived.passwordHash,
        avatarUrl: archived.avatarUrl,
        coverUrl: archived.coverUrl,
        roles: archived.roles,
        isActive: true,
        localEnabled: archived.localEnabled,
        googleId: archived.googleId,
        twoFAEnabled: archived.twoFAEnabled,
        referralCode: archived.referralCode,
        referredBy: archived.referredBy,
        createdAt: archived.originalCreatedAt,
        updatedAt: archived.originalUpdatedAt,
      });
      await ArchivedUser.deleteOne({ _id: archId });
      res.json({ ok: true, userId: String(created._id) });
    } catch (e) {
      next(e);
    }
  },
);

/* ======================= DETAILS / STATS ======================= */
router.get(
  "/:id/details",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.params.id);
      const [user, extra, presence] = await Promise.all([
        User.findById(userId).lean(),
        ProfileExtra.findOne({ user: userId }).lean(),
        Presence.findOne({ user: userId }).lean(),
      ]);
      if (!user) return res.status(404).json({ error: "not_found" });

      const [agg] = await PresenceSession.aggregate([
        { $match: { user: userId } },
        {
          $addFields: {
            computedDurSec: {
              $cond: [
                { $gt: ["$durationSec", 0] },
                "$durationSec",
                {
                  $cond: [
                    { $ne: ["$endedAt", null] },
                    {
                      $divide: [
                        { $subtract: ["$endedAt", "$startedAt"] },
                        1000,
                      ],
                    },
                    {
                      $divide: [
                        { $subtract: ["$lastSeenAt", "$startedAt"] },
                        1000,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$user",
            totalSessions: { $sum: 1 },
            totalDurationSec: {
              $sum: {
                $cond: [{ $gt: ["$computedDurSec", 0] }, "$computedDurSec", 0],
              },
            },
            lastSeenAt: { $max: "$lastSeenAt" },
          },
        },
      ]);

      res.json({
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          coverUrl: user.coverUrl,
          roles: user.roles,
          adminPermissions: user.adminPermissions, // ✅ Inclus dans les détails
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        extra: extra || null,
        presence: presence || null,
        stats: {
          totalSessions: agg?.totalSessions || 0,
          totalDurationSec: Math.round(agg?.totalDurationSec || 0),
          lastSeenAt: agg?.lastSeenAt || null,
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/stats/overview",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { from, to } = parseRange(req);
      const excludedIds = (
        await User.find({ roles: { $in: EXCLUDED_ROLES } }, { _id: 1 }).lean()
      ).map((x) => x._id);
      const newUsers = await User.find(
        {
          createdAt: { $gte: from, $lte: to },
          roles: { $nin: EXCLUDED_ROLES },
        },
        { fullName: 1, email: 1, avatarUrl: 1, createdAt: 1 },
      )
        .sort({ createdAt: -1 })
        .lean();
      const connectedDocs = await Presence.find({
        user: { $nin: excludedIds },
        status: { $in: ["online", "away"] },
      })
        .populate("user", "fullName email avatarUrl roles")
        .lean();
      const connected = connectedDocs.map((p) => ({
        id: String(p.user?._id || p.user),
        fullName: p.user?.fullName || "",
        email: p.user?.email || "",
        avatarUrl: p.user?.avatarUrl || "",
        status: p.status,
        lastPingAt: p.lastPingAt,
      }));

      res.json({
        ok: true,
        range: { from, to },
        newUsersCount: newUsers.length,
        newUsers,
        connected,
      });
    } catch (e) {
      next(e);
    }
  },
);

module.exports = router;
