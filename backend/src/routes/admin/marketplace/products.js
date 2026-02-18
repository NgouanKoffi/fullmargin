// backend/src/routes/admin/marketplace/products.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const User = require("../../../models/user.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

/* ============================================================
   🔐 AUTH MIDDLEWARES
============================================================ */
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

/* ✅ Permet l’auth par token en query pour <img>/<iframe> */
router.use((req, _res, next) => {
  if (!req.headers.authorization && typeof req.query.token === "string") {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

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
  if (!id || !mongoose.isValidObjectId(id)) return u;
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

router.use(requireAuth, requireStaff);

/* ============================================================
   🧱 MODEL LOADING (robuste)
============================================================ */
function safeRequire(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

function getModel(name, candidates, fallbackCollection) {
  if (mongoose.models[name]) return mongoose.models[name];
  for (const rel of candidates) {
    const mod = safeRequire(path.join(__dirname, rel));
    if (mod) return mongoose.models[name] || mod;
  }
  const schema = new mongoose.Schema(
    {},
    { strict: false, timestamps: true, collection: fallbackCollection }
  );
  return mongoose.model(name, schema);
}

const Product = getModel(
  "MarketplaceProduct",
  [
    "../../../models/marketplace.product.model",
    "../../../models/marketplaceProduct.model",
    "../../../models/product.model",
  ],
  "marketplace_products"
);

const Shop = getModel(
  "MarketplaceShop",
  [
    "../../../models/marketplace.shop.model",
    "../../../models/marketplaceShop.model",
    "../../../models/shop.model",
  ],
  "marketplace_shops"
);

const Category = getModel(
  "MarketplaceCategory",
  [
    "../../../models/marketplace.category.model",
    "../../../models/marketplaceCategory.model",
    "../../../models/category.model",
  ],
  "marketplace_categories"
);

/* ============================================================
   🧮 HELPERS
============================================================ */
function parseSort(sortStr) {
  const s = String(sortStr || "").trim();
  if (!s) return { updatedAt: -1 };
  const field = s.startsWith("-") ? s.slice(1) : s;
  const dir = s.startsWith("-") ? -1 : 1;
  return { [field]: dir };
}

/* ----------------- ✅ Créateur produit (user lite) ----------------- */
function pickId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v._id || v.id || "");
  return "";
}

function firstValidObjectId(list) {
  for (const v of list) {
    const id = pickId(v);
    if (id && mongoose.isValidObjectId(id)) return id;
  }
  return "";
}

function findCreatorIdFromProduct(d) {
  // ⚠️ robuste: on teste plusieurs champs possibles
  return firstValidObjectId([
    d.createdBy,
    d.createdById,
    d.owner,
    d.ownerId,
    d.user,
    d.userId,
    d.author,
    d.authorId,
    d.seller,
    d.sellerId,
    d.vendor,
    d.vendorId,
    d.createdByUser,
    d.createdByUserId,
  ]);
}

function findCreatorIdFromShop(s) {
  if (!s) return "";
  return firstValidObjectId([
    s.owner,
    s.ownerId,
    s.user,
    s.userId,
    s.createdBy,
    s.createdById,
  ]);
}

function normalizeUserLite(u) {
  if (!u) return null;

  const first = String(u.firstName || u.prenom || "").trim();
  const last = String(u.lastName || u.nom || "").trim();
  const fullFromParts = [first, last].filter(Boolean).join(" ").trim();
  const full = String(u.fullName || u.name || fullFromParts || "").trim();
  const email = String(u.email || "").trim();

  return {
    id: String(u._id),
    firstName: first,
    lastName: last,
    email,
    name: full || email || "",
  };
}

/* ----------------- DTO ----------------- */
function toProductDTO(doc, shopDoc, catDoc, creatorUser) {
  const pricing = (() => {
    const p = doc.pricing || {};
    if (p.mode === "subscription") {
      return {
        mode: "subscription",
        amount: Number(p.amount || 0),
        interval: p.interval === "year" ? "year" : "month",
      };
    }
    return { mode: "one_time", amount: Number(p.amount || 0) };
  })();

  const shop = shopDoc
    ? {
        id: String(shopDoc._id),
        name: String(shopDoc.name || ""),
        slug: String(shopDoc.slug || ""),
      }
    : doc.shop && typeof doc.shop === "object"
    ? {
        id: String(doc.shop.id || doc.shop._id || ""),
        name: String(doc.shop.name || ""),
        slug: String(doc.shop.slug || ""),
      }
    : null;

  const category = catDoc
    ? {
        id: String(catDoc._id),
        key: String(catDoc.key || catDoc.slug || ""),
        label: String(catDoc.label || catDoc.name || ""),
      }
    : null;

  return {
    id: String(doc._id),
    title: String(doc.title || doc.name || ""),
    shortDescription: String(doc.shortDescription || doc.description || ""),
    status: String(doc.status || "pending"),
    type: String(doc.type || "product"),
    imageUrl: String(doc.imageUrl || doc.coverUrl || ""),
    pricing,
    shop,
    category,
    ratingAvg: Number(doc.ratingAvg || 0),
    ratingCount: Number(doc.ratingCount || 0),
    updatedAt: doc.updatedAt || null,
    badgeEligible: !!doc.badgeEligible,
    featured: !!doc.featured,
    deletedAt: doc.deletedAt || null,

    // ✅ NEW: infos créateur
    createdBy: creatorUser || null,
  };
}

const clamp = (s, n) => String(s || "").slice(0, n);
function parseDataUrl(dataUrl = "") {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(String(dataUrl).trim());
  if (!m) return null;
  const mime = m[1];
  const buffer = Buffer.from(m[2], "base64");
  return { mime, buffer };
}
const isHttp = (u) => /^https?:\/\//i.test(String(u || ""));
function safeFilename(name, fallback = "fichier") {
  const base = String(name || fallback)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");
  return base || fallback;
}

/* ============================================================
   📍 ROUTES
============================================================ */

/**
 * GET /api/admin/marketplace/products
 */
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const shopId = String(req.query.shopId || "").trim();
    const categoryKey = String(req.query.categoryKey || "").trim();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.max(
      1,
      Math.min(parseInt(req.query.pageSize || "25", 10), 100)
    );
    const sort = parseSort(req.query.sort || "-updatedAt");

    const find = {};
    if (q) {
      find.$or = [
        { title: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (status) find.status = status;
    if (shopId && mongoose.isValidObjectId(shopId)) {
      find.$or = (find.$or || []).concat([
        { shop: new mongoose.Types.ObjectId(shopId) },
        { "shop._id": new mongoose.Types.ObjectId(shopId) },
        { "shop.id": new mongoose.Types.ObjectId(shopId) },
        { "shop.id": shopId },
      ]);
    }
    if (categoryKey) {
      // on matche aussi le string "category" (ancien champ)
      find.$or = (find.$or || []).concat([
        { "category.key": categoryKey },
        { "category.slug": categoryKey },
        { categoryKey },
        { category: categoryKey },
      ]);
    }

    const total = await Product.countDocuments(find);
    const docs = await Product.find(find)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const shopIds = Array.from(
      new Set(
        docs
          .map((d) => String(d.shop?._id || d.shop?.id || d.shop))
          .filter((x) => mongoose.isValidObjectId(x))
      )
    ).map((id) => new mongoose.Types.ObjectId(id));

    // ✅ résout la clé de catégorie à partir de (object|categoryKey|string category)
    const catKeys = Array.from(
      new Set(
        docs
          .map((d) =>
            String(
              (d.category && typeof d.category === "object"
                ? d.category.key || d.category.slug
                : d.categoryKey || d.category) || ""
            )
          )
          .filter(Boolean)
      )
    );

    const [shops, cats] = await Promise.all([
      shopIds.length ? Shop.find({ _id: { $in: shopIds } }).lean() : [],
      catKeys.length
        ? Category.find({
            $or: [{ key: { $in: catKeys } }, { slug: { $in: catKeys } }],
          }).lean()
        : [],
    ]);

    const byShop = new Map(shops.map((s) => [String(s._id), s]));
    const byCatKey = new Map(
      cats.flatMap((c) => [
        [String(c.key || ""), c],
        [String(c.slug || ""), c],
      ])
    );

    /* ✅ NEW: build créateurs (1 seule requête User pour toute la page) */
    const creatorIdByProductId = new Map();
    const creatorIds = new Set();

    for (const d of docs) {
      const sid = String(d.shop?._id || d.shop?.id || d.shop || "");
      const shopDoc =
        byShop.get(sid) ||
        (d.shop && typeof d.shop === "object" ? d.shop : null);

      const creatorId =
        findCreatorIdFromProduct(d) || findCreatorIdFromShop(shopDoc);

      if (creatorId) {
        const cid = String(creatorId);
        creatorIds.add(cid);
        creatorIdByProductId.set(String(d._id), cid);
      }
    }

    const creatorObjectIds = Array.from(creatorIds)
      .filter((x) => mongoose.isValidObjectId(x))
      .map((x) => new mongoose.Types.ObjectId(x));

    const users = creatorObjectIds.length
      ? await User.find({ _id: { $in: creatorObjectIds } })
          .select("_id firstName lastName prenom nom email name fullName")
          .lean()
      : [];

    const byUserId = new Map(
      users.map((u) => [String(u._id), normalizeUserLite(u)])
    );

    const items = docs.map((d) => {
      const sid = String(d.shop?._id || d.shop?.id || d.shop || "");
      const ckey = String(
        (d.category && typeof d.category === "object"
          ? d.category.key || d.category.slug
          : d.categoryKey || d.category) || ""
      );
      const catDoc = byCatKey.get(ckey);

      const creatorId = creatorIdByProductId.get(String(d._id));
      const creatorUser = creatorId ? byUserId.get(String(creatorId)) : null;

      return toProductDTO(d, byShop.get(sid), catDoc, creatorUser);
    });

    res.json({
      ok: true,
      data: { items, page, pageSize, total },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/marketplace/products/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const p = await Product.findById(id).lean();
    if (!p) return res.status(404).json({ ok: false, error: "not_found" });

    // ✅ NEW: hydrate createdBy (produit -> fallback shop)
    const sid = String(p.shop?._id || p.shop?.id || p.shop || "");
    const shopDoc =
      sid && mongoose.isValidObjectId(sid)
        ? await Shop.findById(sid).lean()
        : null;

    const shopLike =
      shopDoc || (p.shop && typeof p.shop === "object" ? p.shop : null);

    const creatorId =
      findCreatorIdFromProduct(p) || findCreatorIdFromShop(shopLike);

    let createdBy = null;
    if (creatorId && mongoose.isValidObjectId(String(creatorId))) {
      const u = await User.findById(creatorId)
        .select("_id firstName lastName prenom nom email name fullName")
        .lean();
      createdBy = normalizeUserLite(u);
    }

    res.json({
      ok: true,
      data: { product: { ...p, createdBy } },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ GET /api/admin/marketplace/products/:id/file
 */
router.get("/:id/file", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).send("invalid_id");

    const p = await Product.findById(id).lean();
    if (!p) return res.status(404).send("not_found");

    const fileUrl = String(p.fileUrl || "");
    const mimeDb = String(p.fileMime || "");
    const name = safeFilename(req.query.name || p.fileName || "fichier");
    const disposition =
      String(req.query.disposition || "inline") === "attachment"
        ? "attachment"
        : "inline";

    if (!fileUrl) return res.status(404).send("no_file");

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set(
      "Content-Disposition",
      `${disposition}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(
        name
      )}`
    );

    const parsed = parseDataUrl(fileUrl);
    if (parsed) {
      res.set(
        "Content-Type",
        mimeDb || parsed.mime || "application/octet-stream"
      );
      return res.status(200).end(parsed.buffer);
    }

    if (isHttp(fileUrl)) {
      let fetchImpl = global.fetch;
      if (!fetchImpl) fetchImpl = require("node-fetch");
      const r = await fetchImpl(fileUrl);
      if (!r.ok) return res.status(502).send("upstream_error");

      const ab = await r.arrayBuffer();
      const buf = Buffer.from(ab);
      const ct =
        mimeDb || r.headers.get("content-type") || "application/octet-stream";
      res.set("Content-Type", ct);
      res.set("Content-Length", String(buf.length));
      return res.status(200).end(buf);
    }

    return res.status(400).send("unsupported_url");
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/admin/marketplace/products/:id
 * → Mise à jour robuste (lecture → mutation → save)
 *   ⚠ category est un STRING dans le modèle.
 */
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const p = await Product.findById(id);
    if (!p) return res.status(404).json({ ok: false, error: "not_found" });

    const b = req.body || {};
    const setStr = (v, max) => String(v ?? "").slice(0, max);

    // ----- STATUS + modération
    if (typeof b.status === "string") {
      const newStatus = String(b.status);
      p.status = newStatus;

      p.moderation = p.moderation || {};
      p.moderation.reviewedAt = new Date();
      p.moderation.reviewedBy = req.user?.id || null;

      // statut bloquant → on coupe badge + mise en avant
      if (["rejected", "suspended"].includes(newStatus)) {
        p.badgeEligible = false;
        p.featured = false;
      }
    }

    if (typeof b.moderationReason === "string") {
      p.moderation = p.moderation || {};
      p.moderation.reason = setStr(b.moderationReason, 2000);
    }

    // ----- Drapeaux
    if (b.verified !== undefined) p.verified = !!b.verified;
    if (b.featured !== undefined) p.featured = !!b.featured;

    // ----- Catégorie (id ou key) — STOCKÉE EN STRING
    async function applyCategory(cat) {
      const key = String(cat.key || cat.slug || "");
      p.category = key; // <= string dans le modèle
      p.categoryKey = key; // meta optionnel
    }

    if (b.categoryId && mongoose.isValidObjectId(b.categoryId)) {
      const cat = await Category.findById(b.categoryId).lean();
      if (!cat)
        return res.status(404).json({ ok: false, error: "category_not_found" });
      await applyCategory(cat);
    } else if (typeof b.categoryKey === "string") {
      const ck = String(b.categoryKey).trim();
      if (ck) {
        const cat = await Category.findOne({
          $or: [{ key: ck }, { slug: ck }],
        }).lean();
        if (!cat)
          return res
            .status(404)
            .json({ ok: false, error: "category_not_found" });
        await applyCategory(cat);
      }
    }

    // ----- Champs texte
    if (b.title !== undefined) p.title = setStr(b.title, 120);
    if (b.shortDescription !== undefined)
      p.shortDescription = setStr(b.shortDescription, 180);
    if (b.longDescription !== undefined)
      p.longDescription = setStr(b.longDescription, 8000);
    if (b.type !== undefined) p.type = String(b.type || "");
    if (b.imageUrl !== undefined) p.imageUrl = setStr(b.imageUrl, 500000);
    if (b.fileUrl !== undefined) p.fileUrl = setStr(b.fileUrl, 500000);
    if (b.fileName !== undefined) p.fileName = setStr(b.fileName, 250);
    if (b.fileMime !== undefined) p.fileMime = setStr(b.fileMime, 120);

    // ----- Pricing
    if (b.pricing !== undefined) {
      const pr = b.pricing && typeof b.pricing === "object" ? b.pricing : null;
      if (
        !pr ||
        !["one_time", "subscription"].includes(pr.mode) ||
        pr.amount == null
      ) {
        return res.status(400).json({ ok: false, error: "invalid_pricing" });
      }

      const normAmount = Number(pr.amount);
      if (!Number.isFinite(normAmount) || normAmount < 0)
        return res.status(400).json({ ok: false, error: "invalid_amount" });

      if (pr.mode === "subscription") {
        const interval =
          pr.interval === "year"
            ? "year"
            : pr.interval === "month"
            ? "month"
            : null;
        if (!interval)
          return res.status(400).json({ ok: false, error: "invalid_interval" });
        p.pricing = { mode: "subscription", amount: normAmount, interval };
      } else {
        p.pricing = { mode: "one_time", amount: normAmount };
      }
    }

    await p.save();

    return res.json({
      ok: true,
      data: {
        updatedAt: new Date().toISOString(),
        status: p.status,
        badgeEligible: !!p.badgeEligible,
        featured: !!p.featured,
      },
    });
  } catch (e) {
    console.error("[ADMIN PATCH PRODUCT] ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * PATCH /api/admin/marketplace/products/:id/badge
 */
router.patch("/:id/badge", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ ok: false, error: "not_found" });

    // 🛑 interdit si rejeté ou suspendu
    if (["rejected", "suspended"].includes(String(product.status))) {
      return res
        .status(400)
        .json({ ok: false, error: "badge_forbidden_for_status" });
    }

    const newState = !product.badgeEligible;
    product.badgeEligible = newState;
    await product.save();

    res.json({
      ok: true,
      data: {
        id: String(product._id),
        badgeEligible: newState,
        message: newState
          ? "Badge attribué avec succès ✅"
          : "Badge retiré avec succès ❌",
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/marketplace/products/:id
 * → soft delete + enregistre le motif côté modération
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const p = await Product.findById(id);
    if (!p) return res.status(404).json({ ok: false, error: "not_found" });

    // Motif possible envoyé depuis le front
    const reason = String(
      req.body?.reason || req.body?.moderationReason || ""
    ).slice(0, 2000);
    if (reason) {
      p.moderation = p.moderation || {};
      p.moderation.reason = reason;
      p.moderation.reviewedAt = new Date();
      p.moderation.reviewedBy = req.user?.id || null;
    }

    if (!p.deletedAt) p.deletedAt = new Date();
    await p.save();

    res.json({
      ok: true,
      data: { id, deletedAt: p.deletedAt, message: "Produit supprimé ✅" },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
