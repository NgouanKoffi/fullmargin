const Promo = require("../../../../models/promoCode.model");

/* -------------------- Validation des promos -------------------- */
async function validatePromoForProduct({ code, product }) {
  if (!code) return null;
  const now = new Date();
  const promo = await Promo.findOne({
    code: String(code).trim().toUpperCase(),
    active: true,
    deletedAt: null,
    startsAt: { $lte: now },
    $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
  }).lean();

  if (!promo) return { error: "Code promo invalide ou expiré" };

  if (promo.maxUse != null && Number(promo.used || 0) >= Number(promo.maxUse)) {
    return { error: "Code promo épuisé" };
  }

  const scope = promo.scope || "global";
  if (scope === "global") return { promo };

  if (scope === "category") {
    const catKey = String(product.category || "").trim();
    if (catKey && catKey === String(promo.categoryKey || "").trim())
      return { promo };
    return { error: "Ce code n'est pas valable pour cette catégorie" };
  }

  if (scope === "shop") {
    if (product.shop && String(product.shop) === String(promo.shopId))
      return { promo };
    return { error: "Ce code n'est pas valable pour cette boutique" };
  }

  if (scope === "product") {
    if (String(product._id) === String(promo.productId)) return { promo };
    return { error: "Ce code n'est pas valable pour ce produit" };
  }

  return { error: "Portée de code promo invalide" };
}

function applyPromoToUnit({ unitAmount, promo }) {
  if (!promo) return { finalUnit: unitAmount, discountUnit: 0 };

  const type = promo.type === "amount" ? "amount" : "percent";
  const rawValue = Math.max(1, Number(promo.value || 0));
  let discount = 0;

  if (type === "percent") {
    const pct = Math.min(95, rawValue);
    discount = (unitAmount * pct) / 100;
  } else {
    discount = rawValue;
  }

  discount = Math.min(discount, unitAmount);
  const finalUnit = Math.max(0, unitAmount - discount);

  return {
    finalUnit: Number(finalUnit.toFixed(2)),
    discountUnit: Number(discount.toFixed(2)),
  };
}

module.exports = { validatePromoForProduct, applyPromoToUnit };
