// backend/src/routes/admin/marketplace/products.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const Product = require("../../../models/product.model");
const Shop = require("../../../models/shop.model");
const Category = require("../../../models/category.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

/* utils */
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};
const str = (v) => (typeof v === "string" ? v.trim() : "");
const asInt = (v, dflt) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : dflt;
};

/* req id + no-cache */
router.use((req, _res, next) => {
  req._rid =
    req._rid || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  next();
});
router.use((_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

/* auth */
function requireAdmin(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || a.role !== "admin")
      return res.status(403).json({ ok: false, error: "Réservé aux admins" });
    req.auth = { userId: a.userId, role: a.role };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* LIST (filtrable/paginée/sort) */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const q = str(req.query.q);
    const status = str(req.query.status); // pending|published|rejected|draft|suspended...
    const shopId = str(req.query.shopId);
    const categoryKey = str(req.query.categoryKey);
    const sort = str(req.query.sort) || "-updatedAt";
    const page = Math.max(1, asInt(req.query.page, 1));
    const pageSize = Math.max(1, Math.min(100, asInt(req.query.pageSize, 25)));

    const filter = { deletedAt: null };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (shopId) filter.shop = shopId;
    if (categoryKey) filter.category = categoryKey; // cf. mapping ci-dessous

    const rows = await Product.find(filter)
      .populate({ path: "shop", select: "_id name slug", model: Shop })
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const total = await Product.countDocuments(filter);

    // Normalisation catégorie: on renvoie la clé ET le label si Category existe
    const cats = await Category.find({ deletedAt: null })
      .select("_id key label")
      .lean();
    const byKey = new Map(cats.map((c) => [c.key, c]));
    const byId = new Map(cats.map((c) => [String(c._id), c]));

    const items = rows.map((p) => {
      const shop = p.shop
        ? { id: String(p.shop._id), name: p.shop.name, slug: p.shop.slug || "" }
        : null;
      const cat =
        byKey.get(p.category) || byId.get(String(p.categoryId || "")) || null;
      return {
        id: String(p._id),
        title: p.title,
        shortDescription: p.shortDescription,
        status: p.status,
        type: p.type,
        imageUrl: p.imageUrl || "",
        pricing: p.pricing,
        shop,
        category: cat
          ? { id: String(cat._id), key: cat.key, label: cat.label }
          : p.category
          ? { id: "", key: p.category, label: p.category }
          : null,
        ratingAvg: p.ratingAvg || 0,
        ratingCount: p.ratingCount || 0,
        updatedAt: toISO(p.updatedAt),
      };
    });

    return res
      .status(200)
      .json({ ok: true, data: { items, page, pageSize, total } });
  } catch (e) {
    console.error("[ADMIN PRODUCTS] LIST ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* PATCH (modération rapide: status / verified flag / category remap) */
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const p = await Product.findOne({ _id: req.params.id, deletedAt: null });
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    const b = req.body || {};
    if (b.status) p.status = String(b.status);
    if (b.verified !== undefined) p.verified = !!b.verified;

    // re-mapper la catégorie depuis l'admin
    if (b.categoryId || b.categoryKey) {
      const cat = b.categoryId
        ? await Category.findOne({ _id: b.categoryId, deletedAt: null }).lean()
        : await Category.findOne({
            key: String(b.categoryKey || "").trim(),
            deletedAt: null,
          }).lean();
      if (!cat)
        return res.status(400).json({ ok: false, error: "Catégorie invalide" });
      p.categoryId = cat._id;
      p.category = cat.key; // 🔑 on stocke la 'key' comme référence simple
    }

    await p.save();
    return res
      .status(200)
      .json({
        ok: true,
        data: { updatedAt: toISO(p.updatedAt), status: p.status },
      });
  } catch (e) {
    console.error("[ADMIN PRODUCTS] PATCH ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

module.exports = router;
