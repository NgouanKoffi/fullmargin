// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\admin\marketplace\promo-codes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Promo = require("../../../models/promoCode.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

// ➕ on importe Shop pour exposer le nom en liste
const path = require("path");
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

/* --- Auth minimal admin/agent --- */
function pickReqUser(req) {
  return req.user || req.auth?.user || req.session?.user || null;
}
async function requireAuth(req, res, next) {
  try {
    if (!pickReqUser(req)) {
      const a = verifyAuthHeader(req);
      if (a?.userId) req.user = { id: a.userId, roles: a.roles || [] };
    }
    if (!pickReqUser(req))
      return res.status(401).json({ ok: false, error: "unauthorized" });
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
}
function requireStaff(req, res, next) {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  if (!(roles.includes("admin") || roles.includes("agent"))) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  next();
}
router.use(requireAuth, requireStaff);

/* --- Helpers --- */
const str = (v) => (typeof v === "string" ? v.trim() : "");
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};

/* LIST */
router.get("/", async (_req, res, next) => {
  try {
    const docs = await Promo.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    // ➕ Résolution des noms de boutique
    const shopIds = Array.from(
      new Set(
        docs
          .map((d) => d.shopId)
          .filter((id) => id && mongoose.isValidObjectId(id))
          .map(String)
      )
    );
    const shops = shopIds.length
      ? await Shop.find({ _id: { $in: shopIds } })
          .select("name")
          .lean()
      : [];
    const byShop = new Map(shops.map((s) => [String(s._id), s]));

    const items = docs.map((p) => ({
      id: String(p._id),
      code: p.code,
      type: p.type,
      value: p.value,
      startsAt: p.startsAt ? toISO(p.startsAt) : null,
      endsAt: p.endsAt ? toISO(p.endsAt) : null,
      maxUse: p.maxUse,
      used: p.used,
      active: !!p.active,
      scope: p.scope, // "global" | "category" | "product" | "shop"
      categoryKey: p.categoryKey || undefined,
      productId: p.productId ? String(p.productId) : undefined,
      shopId: p.shopId ? String(p.shopId) : undefined,
      shopName: p.shopId
        ? byShop.get(String(p.shopId))?.name || "—"
        : undefined,
      createdAt: toISO(p.createdAt),
      updatedAt: toISO(p.updatedAt),
    }));
    res.json({ ok: true, data: { items } });
  } catch (e) {
    next(e);
  }
});

/* CREATE */
router.post("/", async (req, res, next) => {
  try {
    const b = req.body || {};
    const code = str(b.code).toUpperCase();
    if (!code)
      return res.status(400).json({ ok: false, error: "invalid_code" });

    const type = b.type === "amount" ? "amount" : "percent";
    const value = Math.max(1, Number(b.value || 0));
    if (!Number.isFinite(value))
      return res.status(400).json({ ok: false, error: "invalid_value" });
    if (type === "percent" && value > 95)
      return res.status(400).json({ ok: false, error: "percent_too_high" });

    // ➕ shop support here
    const scope = ["global", "category", "product", "shop"].includes(b.scope)
      ? b.scope
      : "global";
    const categoryKey = scope === "category" ? str(b.categoryKey) : null;
    const productId =
      scope === "product" &&
      b.productId &&
      mongoose.isValidObjectId(b.productId)
        ? new mongoose.Types.ObjectId(String(b.productId))
        : null;
    const shopId =
      scope === "shop" && b.shopId && mongoose.isValidObjectId(b.shopId)
        ? new mongoose.Types.ObjectId(String(b.shopId))
        : null;

    const startsAt = b.startsAt ? new Date(b.startsAt) : new Date();
    const endsAt = b.endsAt ? new Date(b.endsAt) : null;
    const maxUse = b.maxUse != null ? Math.max(1, Number(b.maxUse)) : null;

    // ✅ VALIDATIONS DE PORTÉE (400 explicites)
    if (scope === "category" && !categoryKey) {
      return res.status(400).json({ ok: false, error: "category_required" });
    }
    if (scope === "product" && !productId) {
      return res.status(400).json({ ok: false, error: "product_required" });
    }
    if (scope === "shop" && !shopId) {
      return res.status(400).json({ ok: false, error: "shop_required" });
    }
    if (endsAt && endsAt <= startsAt) {
      return res.status(400).json({ ok: false, error: "invalid_dates" });
    }

    const doc = await Promo.create({
      code,
      type,
      value,
      scope,
      categoryKey,
      productId,
      shopId,
      startsAt,
      endsAt,
      maxUse,
      used: 0,
      active: b.active !== false, // par défaut actif
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.json({
      ok: true,
      data: { id: String(doc._id), updatedAt: toISO(doc.updatedAt) },
    });
  } catch (e) {
    if (e?.code === 11000)
      return res.status(409).json({ ok: false, error: "code_exists" });
    next(e);
  }
});

/* PATCH */
router.patch("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const $set = {};
    const b = req.body || {};

    if (b.code !== undefined) $set.code = str(b.code).toUpperCase();
    if (b.type !== undefined)
      $set.type = b.type === "amount" ? "amount" : "percent";
    if (b.value !== undefined) $set.value = Math.max(1, Number(b.value) || 1);
    if (b.active !== undefined) $set.active = !!b.active;
    if (b.startsAt !== undefined)
      $set.startsAt = b.startsAt ? new Date(b.startsAt) : null;
    if (b.endsAt !== undefined)
      $set.endsAt = b.endsAt ? new Date(b.endsAt) : null;
    if (b.maxUse !== undefined)
      $set.maxUse =
        b.maxUse != null ? Math.max(1, Number(b.maxUse) || 1) : null;

    if (b.scope !== undefined) {
      const sc = ["global", "category", "product", "shop"].includes(b.scope)
        ? b.scope
        : "global";
      $set.scope = sc;
      if (sc === "category") {
        $set.categoryKey = str(b.categoryKey);
        $set.productId = null;
        $set.shopId = null;
      } else if (sc === "product") {
        $set.productId =
          b.productId && mongoose.isValidObjectId(b.productId)
            ? new mongoose.Types.ObjectId(String(b.productId))
            : null;
        $set.categoryKey = null;
        $set.shopId = null;
      } else if (sc === "shop") {
        $set.shopId =
          b.shopId && mongoose.isValidObjectId(b.shopId)
            ? new mongoose.Types.ObjectId(String(b.shopId))
            : null;
        $set.categoryKey = null;
        $set.productId = null;
      } else {
        $set.categoryKey = null;
        $set.productId = null;
        $set.shopId = null;
      }
    } else {
      if (b.categoryKey !== undefined) $set.categoryKey = str(b.categoryKey);
      if (b.productId !== undefined) {
        $set.productId =
          b.productId && mongoose.isValidObjectId(b.productId)
            ? new mongoose.Types.ObjectId(String(b.productId))
            : null;
      }
      if (b.shopId !== undefined) {
        $set.shopId =
          b.shopId && mongoose.isValidObjectId(b.shopId)
            ? new mongoose.Types.ObjectId(String(b.shopId))
            : null;
      }
    }

    $set.updatedBy = req.user?.id || null;

    const r = await Promo.updateOne({ _id: id, deletedAt: null }, { $set });
    if (!r.matchedCount && !r.n)
      return res.status(404).json({ ok: false, error: "not_found" });

    return res.json({
      ok: true,
      data: { updatedAt: new Date().toISOString() },
    });
  } catch (e) {
    next(e);
  }
});

/* DELETE (soft) */
router.delete("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ ok: false, error: "invalid_id" });

    const r = await Promo.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), updatedBy: req.user?.id || null } }
    );
    if (!r.matchedCount && !r.n)
      return res.status(404).json({ ok: false, error: "not_found" });

    res.json({ ok: true, data: { deleted: true } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
