const express = require("express");
const router = express.Router();

const Promo = require("../../models/promoCode.model");
const Product = require("../../models/product.model");
const Shop = require("../../models/shop.model");

/* Utils */
const now = () => new Date();
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};
const str = (v) => (typeof v === "string" ? v.trim() : "");
const asMoney = (n) => Math.max(0, Math.round(Number(n || 0)));

function computeDiscounted(pricing, promo) {
  // pricing = { mode: "one_time"|"subscription", amount, interval? }
  if (!pricing || typeof pricing !== "object") return null;
  const amount = Number(pricing.amount || 0);
  if (!Number.isFinite(amount)) return null;

  let discounted = amount;
  if (promo.type === "percent")
    discounted = amount * (1 - Number(promo.value || 0) / 100);
  else discounted = amount - Number(promo.value || 0);

  discounted = Math.max(0, Math.round(discounted * 100) / 100);

  return {
    original: { ...pricing },
    final: { ...pricing, amount: discounted },
    discount: Math.max(0, Math.round((amount - discounted) * 100) / 100),
  };
}

async function loadProduct(productId) {
  const p = await Product.findOne({
    _id: productId,
    status: "published",
    deletedAt: null,
  })
    .select("_id title pricing category shop")
    .lean();
  return p || null;
}

function basicPromoChecks(doc) {
  if (!doc) return { ok: false, reason: "Code promo introuvable." };
  if (doc.deletedAt) return { ok: false, reason: "Code promo supprimé." };
  if (!doc.active) return { ok: false, reason: "Code promo inactif." };

  const n = now();
  if (doc.startsAt && n < new Date(doc.startsAt))
    return { ok: false, reason: "Pas encore valide." };
  if (doc.endsAt && n > new Date(doc.endsAt))
    return { ok: false, reason: "Expiré." };
  if (doc.maxUse != null && Number(doc.used || 0) >= Number(doc.maxUse)) {
    return { ok: false, reason: "Quota d’utilisations atteint." };
  }
  return { ok: true };
}

/**
 * POST /api/marketplace/public/promos/validate
 * body: { code: string, productId: string }
 * → { ok, data: { valid, reason?, scope, type, value, pricing: { original, final, discount } } }
 */
router.post("/validate", async (req, res) => {
  try {
    const code = str(req.body?.code).toUpperCase();
    const productId = str(req.body?.productId);
    if (!code || !productId) {
      return res
        .status(400)
        .json({ ok: false, error: "Paramètres manquants." });
    }

    const [promo, product] = await Promise.all([
      Promo.findOne({ code, deletedAt: null }).lean(),
      loadProduct(productId),
    ]);

    const basic = basicPromoChecks(promo);
    if (!basic.ok) {
      return res
        .status(200)
        .json({ ok: true, data: { valid: false, reason: basic.reason } });
    }
    if (!product) {
      return res.status(404).json({ ok: false, error: "Produit introuvable." });
    }

    // vérification de portée
    let eligible = false;
    if (promo.scope === "global") eligible = true;
    else if (promo.scope === "category") {
      eligible =
        !!promo.categoryKey && promo.categoryKey === (product.category || "");
    } else if (promo.scope === "product") {
      eligible = String(promo.productId || "") === String(product._id);
    } else if (promo.scope === "shop") {
      eligible = String(promo.shopId || "") === String(product.shop || "");
    }

    if (!eligible) {
      return res.status(200).json({
        ok: true,
        data: {
          valid: false,
          reason: "Ce code ne s’applique pas à ce produit.",
        },
      });
    }

    // calcul de remise
    const pricing = computeDiscounted(product.pricing, promo);
    if (!pricing) {
      return res.status(200).json({
        ok: true,
        data: { valid: false, reason: "Tarification produit invalide." },
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        valid: true,
        scope: promo.scope,
        type: promo.type,
        value: Number(promo.value || 0),
        pricing,
        // infos confort
        meta: {
          productId: String(product._id),
          categoryKey: product.category || null,
          shopId: product.shop ? String(product.shop) : null,
          startsAt: promo.startsAt ? toISO(promo.startsAt) : null,
          endsAt: promo.endsAt ? toISO(promo.endsAt) : null,
          maxUse: promo.maxUse ?? null,
          used: promo.used ?? 0,
        },
      },
    });
  } catch (e) {
    console.error("[PUBLIC PROMOS] validate ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Validation impossible" });
  }
});

module.exports = router;
