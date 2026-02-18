// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\public.shops.js
const express = require("express");
const router = express.Router();

const Shop = require("../../models/shop.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");

/* ---------- utils ---------- */
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};
const safeStr = (v) =>
  typeof v === "string" ? v.trim() : String(v || "").trim();

router.use((_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

/**
 * GET /api/marketplace/public/shops/:slugOrId/products
 * Liste les produits PUBLIÉS d’une boutique (léger)
 */
router.get("/:slugOrId/products", async (req, res) => {
  try {
    const key = safeStr(req.params.slugOrId);
    let s =
      (await Shop.findOne({ slug: key, deletedAt: null }).lean()) ||
      (await Shop.findOne({ _id: key, deletedAt: null }).lean());
    if (!s) {
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    const rows = await Product.find({
      shop: s._id,
      status: "published",
      deletedAt: null,
    })
      .sort({ updatedAt: -1, _id: -1 })
      .select(
        "_id title shortDescription type imageUrl pricing updatedAt ratingAvg ratingCount badgeEligible"
      )
      .lean();

    const items = rows.map((p) => ({
      id: String(p._id),
      title: p.title,
      shortDescription: p.shortDescription,
      type: p.type,
      imageUrl: p.imageUrl || "",
      pricing: p.pricing,
      updatedAt: toISO(p.updatedAt),
      ratingAvg: p.ratingAvg || 0,
      ratingCount: p.ratingCount || 0,
      badgeEligible: !!p.badgeEligible,
    }));

    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[PUBLIC SHOPS] PRODUCTS ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/**
 * GET /api/marketplace/public/shops
 * Liste publique des boutiques visibles + stats produits publiés
 */
router.get("/", async (_req, res) => {
  try {
    const rows = await Shop.find({ deletedAt: null })
      .sort({ updatedAt: -1, _id: -1 })
      .select(
        "_id name desc signature avatarUrl coverUrl slug createdAt updatedAt"
      )
      .lean();

    // nb produits publiés par boutique
    const counts = await Product.aggregate([
      { $match: { deletedAt: null, status: "published" } },
      { $group: { _id: "$shop", n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

    const items = rows.map((s) => ({
      id: String(s._id),
      name: s.name,
      desc: s.desc,
      signature: s.signature || "",
      avatarUrl: s.avatarUrl || "",
      coverUrl: s.coverUrl || "",
      slug: s.slug || "",
      createdAt: toISO(s.createdAt),
      updatedAt: toISO(s.updatedAt),
      stats: { products: countMap.get(String(s._id)) || 0 },
    }));

    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[PUBLIC SHOPS] GET ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/**
 * GET /api/marketplace/public/shops/:slugOrId
 * Détail d’une boutique
 */
router.get("/:slugOrId", async (req, res) => {
  try {
    const key = safeStr(req.params.slugOrId);
    if (!key) {
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    const s =
      (await Shop.findOne({ slug: key, deletedAt: null }).lean()) ||
      (await Shop.findOne({ _id: key, deletedAt: null }).lean());
    if (!s) {
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    // produits publiés de la boutique
    const prods = await Product.find({
      shop: s._id,
      status: "published",
      deletedAt: null,
    })
      .select("ratingAvg ratingCount")
      .lean();

    const productsCount = prods.length;
    // moyenne globale boutique (pondérée par nb d’avis)
    let totalNotes = 0;
    let totalAvis = 0;
    for (const p of prods) {
      const count = Number(p.ratingCount || 0);
      const avg = Number(p.ratingAvg || 0);
      totalNotes += avg * count;
      totalAvis += count;
    }
    const shopRatingAvg = totalAvis > 0 ? totalNotes / totalAvis : 0;

    const shop = {
      id: String(s._id),
      name: s.name,
      desc: s.desc,
      signature: s.signature || "",
      avatarUrl: s.avatarUrl || "",
      coverUrl: s.coverUrl || "",
      slug: s.slug || "",
      createdAt: toISO(s.createdAt),
      updatedAt: toISO(s.updatedAt),
      stats: {
        products: productsCount,
        ratingAvg: shopRatingAvg,
        ratingCount: totalAvis,
      },
    };

    return res.status(200).json({ ok: true, data: { shop } });
  } catch (e) {
    console.error("[PUBLIC SHOPS] GET BY KEY ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/**
 * GET /api/marketplace/public/shops/:slugOrId/reviews
 * Tous les avis (tous produits publiés de la boutique)
 * Format items: { productId, productTitle, productImageUrl, userId, userName, rating, comment, createdAt }
 */
router.get("/:slugOrId/reviews", async (req, res) => {
  try {
    const key = safeStr(req.params.slugOrId);
    let s =
      (await Shop.findOne({ slug: key, deletedAt: null }).lean()) ||
      (await Shop.findOne({ _id: key, deletedAt: null }).lean());
    if (!s) {
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    const prods = await Product.find({
      shop: s._id,
      status: "published",
      deletedAt: null,
    })
      .select("_id title imageUrl reviews")
      .lean();

    const flattened = [];
    for (const p of prods) {
      const reviews = Array.isArray(p.reviews) ? p.reviews : [];
      for (const r of reviews) {
        flattened.push({
          productId: String(p._id),
          productTitle: p.title || "",
          productImageUrl: p.imageUrl || "",
          userId: String(r.user || ""),
          rating: Number(r.rating || 0),
          comment: r.comment || "",
          createdAt: r.createdAt ? toISO(r.createdAt) : null,
        });
      }
    }

    // Noms d'utilisateurs
    const userIds = Array.from(
      new Set(flattened.map((x) => x.userId).filter(Boolean))
    );
    let nameMap = new Map();
    if (userIds.length) {
      const users = await User.find({ _id: { $in: userIds } })
        .select("_id fullName")
        .lean();
      nameMap = new Map(users.map((u) => [String(u._id), u.fullName || ""]));
    }

    const items = flattened
      .map((x) => ({ ...x, userName: nameMap.get(x.userId) || "Utilisateur" }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[PUBLIC SHOPS] REVIEWS ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des avis impossible" });
  }
});

module.exports = router;
