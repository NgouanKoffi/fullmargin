// backend/src/routes/admin/diffusions.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const DiffusionGroup = require("../../models/diffusionGroup.model");
const User = require("../../models/user.model");

// ✅ helper JWT déjà chez toi
const { verifyAuthHeader } = require("../auth/_helpers");

/* ======================= AUTH (mêmes helpers que /admin/users) ======================= */
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
  if (!id || !mongoose.isValidObjectId(id)) return u; // ⟵ évite crash
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

// 👇 Nouveau: autorise admin **ou** agent
async function requireStaff(req, res, next) {
  try {
    const u = await maybeHydrateUserRoles(req.user);
    const roles = Array.isArray(u?.roles) ? u.roles : [];
    const allowed = roles.includes("admin") || roles.includes("agent");
    if (!allowed) return res.status(403).json({ error: "forbidden" });
    next();
  } catch {
    return res.status(403).json({ error: "forbidden" });
  }
}

/* ======================= UTILS ======================= */
const normBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const normEmails = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((e) =>
      String(e || "")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);

function normalizeSegments(input = {}) {
  return {
    everyone: normBool(input.everyone),
    agents: normBool(input.agents),
    communityOwners: normBool(input.communityOwners), // pour plus tard
    shopOwners: normBool(input.shopOwners), // pour plus tard
    custom: normBool(input.custom),
    customEmails: normEmails(input.customEmails),
  };
}

function oidOrNull(v) {
  try {
    return mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(v) : null;
  } catch {
    return null;
  }
}

/**
 * Résout l'union des destinataires selon les segments.
 */
async function resolveRecipients(segments) {
  const sets = [];

  if (segments.everyone) {
    const all = await User.distinct("email", { email: { $ne: null } });
    sets.push(all);
  }

  if (segments.agents) {
    const agents = await User.distinct("email", {
      email: { $ne: null },
      roles: "agent",
    });
    sets.push(agents);
  }

  // Hooks pour plus tard si tu actives ces rôles
  if (segments.communityOwners) {
    const owners = await User.distinct("email", {
      email: { $ne: null },
      roles: "community_owner",
    });
    sets.push(owners);
  }
  if (segments.shopOwners) {
    const shops = await User.distinct("email", {
      email: { $ne: null },
      roles: "shop_owner",
    });
    sets.push(shops);
  }

  if (segments.custom && Array.isArray(segments.customEmails)) {
    sets.push(segments.customEmails);
  }

  const out = new Set();
  for (const arr of sets) {
    for (const e of arr) {
      const v = String(e || "")
        .trim()
        .toLowerCase();
      if (v) out.add(v);
    }
  }
  return Array.from(out);
}

/* ======================= ROUTES ======================= */

/**
 * ✅ GET /api/admin/diffusions/groups
 * (c’est celle que ton front appelle)
 * Query: q? (recherche par nom), limit? (<=200), mine?=1 par défaut
 * Retour: { groups: [{ id, name, updatedAt }] }
 */
router.get("/groups", requireAuth, requireStaff, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const q = (req.query.q || "").trim();
    const mine = req.query.mine !== "0"; // par défaut filtrer par createdBy

    const find = {};
    if (q) find.name = { $regex: q, $options: "i" };
    if (mine) {
      const userOid = oidOrNull(req.user.id);
      if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
      find.createdBy = userOid;
    }

    const docs = await DiffusionGroup.find(find)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select({ name: 1, updatedAt: 1 })
      .lean();

    const groups = docs.map((g) => ({
      id: String(g._id),
      name: g.name || "",
      updatedAt: g.updatedAt || null,
    }));

    res.json({ groups });
  } catch (e) {
    console.error("[GET /admin/diffusions/groups] error:", e);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * (optionnel) GET /api/admin/diffusions
 * Liste paginée complète
 */
router.get("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);
    const q = (req.query.q || "").trim();
    const mine = req.query.mine !== "0"; // par défaut true

    const find = {};
    if (q) find.name = { $regex: q, $options: "i" };
    if (mine) {
      const userOid = oidOrNull(req.user.id);
      if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
      find.createdBy = userOid;
    }

    const [items, total] = await Promise.all([
      DiffusionGroup.find(find)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      DiffusionGroup.countDocuments(find),
    ]);
    res.json({ items, total, offset, limit });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/admin/diffusions
 * Body: { name, description?, segments, snapshot?=boolean }
 */
router.post("/", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2)
      return res.status(400).json({ error: "name_too_short" });

    const segments = normalizeSegments(req.body?.segments || {});
    const snapshotFlag = normBool(req.body?.snapshot);

    const userOid = oidOrNull(req.user.id);
    if (!userOid) return res.status(400).json({ error: "invalid_user_id" });

    const doc = new DiffusionGroup({
      name,
      description: String(req.body?.description || ""),
      segments,
      createdBy: userOid,
    });

    if (snapshotFlag) {
      const emails = await resolveRecipients(segments);
      doc.snapshotEmails = emails;
      doc.recipientCount = emails.length;
    }

    await doc.save();
    res.status(201).json({ ok: true, group: doc });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/diffusions/:id
 */
router.get("/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const id = oidOrNull(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid_id" });

    const mine = req.query.mine !== "0";
    const find = { _id: id };
    if (mine) {
      const userOid = oidOrNull(req.user.id);
      if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
      find.createdBy = userOid;
    }

    const doc = await DiffusionGroup.findOne(find).lean();
    if (!doc) return res.status(404).json({ error: "not_found" });
    res.json({ group: doc });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/admin/diffusions/:id
 */
router.patch("/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const id = oidOrNull(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid_id" });

    const mine = req.query.mine !== "0";
    const find = { _id: id };
    if (mine) {
      const userOid = oidOrNull(req.user.id);
      if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
      find.createdBy = userOid;
    }

    const doc = await DiffusionGroup.findOne(find);
    if (!doc) return res.status(404).json({ error: "not_found" });

    if (typeof req.body?.name === "string") {
      const nm = req.body.name.trim();
      if (nm.length < 2)
        return res.status(400).json({ error: "name_too_short" });
      doc.name = nm;
    }
    if (typeof req.body?.description === "string") {
      doc.description = req.body.description;
    }
    if (req.body?.segments) {
      doc.segments = normalizeSegments(req.body.segments);
    }

    const snapshotFlag = normBool(req.body?.snapshot);
    if (snapshotFlag) {
      const emails = await resolveRecipients(doc.segments);
      doc.snapshotEmails = emails;
      doc.recipientCount = emails.length;
    }

    await doc.save();
    res.json({ ok: true, group: doc });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/diffusions/:id
 */
router.delete("/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const id = oidOrNull(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid_id" });

    const mine = req.query.mine !== "0";
    const find = { _id: id };
    if (mine) {
      const userOid = oidOrNull(req.user.id);
      if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
      find.createdBy = userOid;
    }

    const out = await DiffusionGroup.deleteOne(find);
    if (!out?.deletedCount) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/admin/diffusions/:id/snapshot
 */
router.post(
  "/:id/snapshot",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = oidOrNull(req.params.id);
      if (!id) return res.status(400).json({ error: "invalid_id" });

      const mine = req.query.mine !== "0";
      const find = { _id: id };
      if (mine) {
        const userOid = oidOrNull(req.user.id);
        if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
        find.createdBy = userOid;
      }

      const doc = await DiffusionGroup.findOne(find);
      if (!doc) return res.status(404).json({ error: "not_found" });

      const emails = await resolveRecipients(doc.segments);
      doc.snapshotEmails = emails;
      doc.recipientCount = emails.length;

      await doc.save();
      res.json({ ok: true, group: doc });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/admin/diffusions/:id/recipients
 * Query: useSnapshot?=1, limit? (<=2000), offset? (>=0)
 */
router.get(
  "/:id/recipients",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = oidOrNull(req.params.id);
      if (!id) return res.status(400).json({ error: "invalid_id" });

      const mine = req.query.mine !== "0";
      const useSnapshot = req.query.useSnapshot === "1";
      const limit = Math.min(parseInt(req.query.limit || "500", 10), 2000);
      const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

      const find = { _id: id };
      if (mine) {
        const userOid = oidOrNull(req.user.id);
        if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
        find.createdBy = userOid;
      }

      const doc = await DiffusionGroup.findOne(find).lean();
      if (!doc) return res.status(404).json({ error: "not_found" });

      const full =
        useSnapshot && doc.snapshotEmails?.length
          ? doc.snapshotEmails
          : await resolveRecipients(doc.segments);

      const total = full.length;
      const slice = full.slice(offset, offset + limit);

      res.json({
        total,
        offset,
        limit,
        items: slice,
        hasMore: offset + limit < total,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /api/admin/diffusions/:id/custom
 * Body: { add?: string[], remove?: string[] }
 */
router.post(
  "/:id/custom",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = oidOrNull(req.params.id);
      if (!id) return res.status(400).json({ error: "invalid_id" });

      const mine = req.query.mine !== "0";
      const find = { _id: id };
      if (mine) {
        const userOid = oidOrNull(req.user.id);
        if (!userOid) return res.status(400).json({ error: "invalid_user_id" });
        find.createdBy = userOid;
      }

      const doc = await DiffusionGroup.findOne(find);
      if (!doc) return res.status(404).json({ error: "not_found" });

      const add = normEmails(req.body?.add);
      const remove = new Set(normEmails(req.body?.remove));

      const current = new Set(doc.segments.customEmails || []);
      for (const r of remove) current.delete(r);
      for (const a of add) current.add(a);

      doc.segments.custom = true;
      doc.segments.customEmails = Array.from(current);

      await doc.save();
      res.json({ ok: true, group: doc });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
