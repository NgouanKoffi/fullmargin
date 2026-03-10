// backend/src/routes/admin/marketplace/categories.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Category = require("../../../models/category.model");
const Product = require("../../../models/product.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

/* ---------- auth de base (admin/agent) ---------- */
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
async function requireAuth(req, res, next) {
  try {
    await attachUserFromHeaderIfNeeded(req);
    const u = pickReqUser(req);
    if (!u) return res.status(401).json({ ok: false, error: "unauthorized" });
    if (!u.id && u._id) u.id = String(u._id);
    req.user = u;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
}
async function requireStaff(req, res, next) {
  try {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    if (!(roles.includes("admin") || roles.includes("agent"))) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
    next();
  } catch {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
}
router.use(requireAuth, requireStaff);

/* ---------- helpers ---------- */
const normKey = (s = "") =>
  String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);

/* ---------- LIST ---------- */
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toLowerCase();
    const find = { deletedAt: null };
    if (q) {
      find.$or = [
        { key: { $regex: q, $options: "i" } },
        { label: { $regex: q, $options: "i" } },
      ];
    }

    const cats = await Category.find(find).sort({ label: 1 }).lean();

    // Compte des produits actifs par catégorie (product.category == key)
    const keys = cats.map((c) => c.key);
    const counts = await Product.aggregate([
      { $match: { deletedAt: null, category: { $in: keys } } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]);

    const byKey = new Map(counts.map((c) => [c._id, c.n]));
    const items = cats.map((c) => ({
      id: String(c._id),
      key: c.key,
      label: c.label,
      commissionPct: Number(c.commissionPct || 0),
      featured: !!c.featured,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      // champ toléré côté front (non typé strict) :
      productsCount: byKey.get(c.key) || 0,
    }));

    res.json({ ok: true, data: { items } });
  } catch (e) {
    next(e);
  }
});

/* ---------- CREATE ---------- */
router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const key = normKey(body.key || "");
    const label = String(body.label || "").trim();
    const commissionPct = Math.max(
      0,
      Math.min(100, Number(body.commissionPct || 0))
    );

    if (!key) return res.status(400).json({ ok: false, error: "invalid_key" });
    if (!label)
      return res.status(400).json({ ok: false, error: "invalid_label" });

    // unicité (soft)
    const exists = await Category.findOne({ key, deletedAt: null }).lean();
    if (exists) return res.status(409).json({ ok: false, error: "key_exists" });

    const cat = await Category.create({
      key,
      label,
      commissionPct,
      featured: !!body.featured,
      deletedAt: null,
    });

    res.json({
      ok: true,
      data: {
        id: String(cat._id),
        key: cat.key,
        label: cat.label,
        commissionPct: cat.commissionPct,
        featured: cat.featured,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

/* ---------- UPDATE (rename / commission / key) ---------- */
router.patch("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const b = req.body || {};
    const $set = {};

    if (b.key !== undefined) {
      const k = normKey(b.key);
      if (!k) return res.status(400).json({ ok: false, error: "invalid_key" });

      // collision (hors lui-même)
      const taken = await Category.findOne({
        _id: { $ne: id },
        key: k,
        deletedAt: null,
      }).lean();
      if (taken)
        return res.status(409).json({ ok: false, error: "key_exists" });

      $set.key = k;
    }

    if (b.label !== undefined) {
      const l = String(b.label || "").trim();
      if (!l)
        return res.status(400).json({ ok: false, error: "invalid_label" });
      $set.label = l;
    }

    if (b.commissionPct !== undefined) {
      const pct = Math.max(0, Math.min(100, Number(b.commissionPct) || 0));
      $set.commissionPct = pct;
    }

    if (b.featured !== undefined) {
      $set.featured = !!b.featured; // (même si l’UI ne l’édite plus)
    }

    const r = await Category.updateOne({ _id: id, deletedAt: null }, { $set });
    if (!r.matchedCount && !r.n)
      return res.status(404).json({ ok: false, error: "not_found" });

    res.json({ ok: true, data: { updatedAt: new Date().toISOString() } });
  } catch (e) {
    next(e);
  }
});

/* ---------- DELETE (soft) ---------- */
router.delete("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const cat = await Category.findById(id);
    if (!cat || cat.deletedAt)
      return res.status(404).json({ ok: false, error: "not_found" });

    cat.deletedAt = new Date();
    await cat.save();

    res.json({ ok: true, data: { deleted: true } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
