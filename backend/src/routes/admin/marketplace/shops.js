// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\admin\marketplace\shops.js
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const path = require("path");
const User = require("../../../models/user.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

/* ===== AUTH (identique à admin/users.js) ===== */
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

/* ===== chargeur de modèle robuste ===== */
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

const Shop = getModel(
  "MarketplaceShop",
  [
    "../../../models/marketplace.shop.model",
    "../../../models/marketplaceShop.model",
    "../../../models/shop.model",
  ],
  "marketplace_shops"
);
const Product = getModel(
  "MarketplaceProduct",
  [
    "../../../models/marketplace.product.model",
    "../../../models/marketplaceProduct.model",
    "../../../models/product.model",
  ],
  "marketplace_products"
);

/* ===== helpers ===== */
function toDisplayName(u) {
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.name || u.fullName || u.username || "";
}

const toShopDTO = (doc, counts, ownerDoc) => ({
  id: String(doc._id),
  name: String(doc.name || doc.title || ""),
  signature: String(doc.signature || ""),
  slug: String(doc.slug || ""),
  owner: String(doc.owner || doc.user || doc.ownerId || ""),
  avatarUrl: String(doc.avatarUrl || ""),
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
  stats: {
    productsTotal: counts?.total ?? 0,
    productsPublished: counts?.published ?? 0,
  },
  status: String(doc.status || "active"),
  ownerName: ownerDoc ? toDisplayName(ownerDoc) || "—" : "—",
  ownerEmail: ownerDoc?.email || "—",
});

/* ========================= ROUTES ========================= */

/** GET /api/admin/marketplace/shops?q= */
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const find = {};
    if (q) {
      find.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { signature: { $regex: q, $options: "i" } },
      ];
    }
    const shops = await Shop.find(find)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Comptage produits par shop (robuste : shop ObjectId ou objet)
    const ids = shops.map((s) => s._id);
    const agg = await Product.aggregate([
      {
        $match: {
          $or: [
            { shop: { $in: ids } },
            { "shop._id": { $in: ids } },
            { "shop.id": { $in: ids } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$shop._id", false] },
              "$shop._id",
              {
                $cond: [{ $ifNull: ["$shop.id", false] }, "$shop.id", "$shop"],
              },
            ],
          },
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
        },
      },
    ]);
    const byShop = new Map(agg.map((a) => [String(a._id), a]));

    // Batch lookup propriétaires
    const rawOwnerIds = shops
      .map((s) => s.owner || s.user || s.ownerId)
      .filter(Boolean)
      .map((v) => String(v));
    const ownerIds = Array.from(new Set(rawOwnerIds)).filter((id) =>
      mongoose.isValidObjectId(id)
    );
    const owners = ownerIds.length
      ? await User.find({ _id: { $in: ownerIds } })
          .select("firstName lastName name fullName username email")
          .lean()
      : [];
    const byOwner = new Map(owners.map((u) => [String(u._id), u]));

    res.json({
      ok: true,
      data: {
        items: shops.map((s) =>
          toShopDTO(
            s,
            byShop.get(String(s._id)),
            byOwner.get(String(s.owner || s.user || s.ownerId || ""))
          )
        ),
      },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/admin/marketplace/shops/:id/status  Body: { action: "activate" | "suspend" } */
router.post("/:id/status", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const action = String(req.body?.action || "").toLowerCase();
    if (!["activate", "suspend"].includes(action))
      return res.status(400).json({ ok: false, error: "invalid_action" });

    const status = action === "activate" ? "active" : "suspended";
    const r = await Shop.updateOne({ _id: id }, { $set: { status } });
    if (!r?.matchedCount && !r?.n)
      return res.status(404).json({ ok: false, error: "not_found" });

    res.json({ ok: true, data: { status } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
