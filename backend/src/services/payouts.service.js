// backend/src/services/payouts.service.js
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const SellerPayout = require("../models/sellerPayout.model");
const AdminCommission = require("../models/adminCommission.model");
const User = require("../models/user.model"); // ✅ Ajout

const toCents = (usd) => Math.round(Number(usd || 0) * 100);
const toUnits = (cents) => Math.round(Number(cents || 0)) / 100;

const DEFAULT_PCT = Number(
  process.env.MARKETPLACE_COMMISSION_PCT ??
    process.env.COMMISSION_PCT_DEFAULT ??
    20,
);

async function getCommissionPctForProduct({ category }) {
  try {
    if (category) {
      let cat =
        (await Category.findOne({ key: String(category) })
          .select("commissionPct parent")
          .lean()) || null;

      if (!cat) {
        cat =
          (await Category.findOne({ _id: String(category) })
            .select("commissionPct parent")
            .lean()) || null;
      }

      if (cat) {
        if (typeof cat.commissionPct === "number")
          return Math.max(0, Number(cat.commissionPct));
        if (cat.parent) {
          const parent = await Category.findById(cat.parent)
            .select("commissionPct")
            .lean();
          if (parent && typeof parent.commissionPct === "number")
            return Math.max(0, Number(parent.commissionPct));
        }
      }
    }
  } catch (e) {
    console.warn("[commission] lookup error:", e?.message || e);
  }
  return Math.max(0, DEFAULT_PCT);
}

async function ensurePayoutsForOrder(orderOrId) {
  const Order = require("../models/order.model");

  const order =
    typeof orderOrId === "string"
      ? await Order.findById(orderOrId).lean()
      : orderOrId?.toObject?.() || orderOrId;

  if (!order || order.status !== "succeeded") return;

  const currency = String(order.currency || "usd").toLowerCase();
  const buyerId = order.user;
  const pctCache = new Map();

  for (const it of order.items || []) {
    try {
      let sellerId = it.seller || null;
      let shopId = it.shop || null;
      let categoryKey = null;

      if (!sellerId || categoryKey == null) {
        const product = await Product.findById(it.product)
          .select("_id user shop category")
          .lean();
        if (product) {
          sellerId = sellerId || product.user;
          shopId = shopId || product.shop || null;
          categoryKey = product.category ?? null;
        }
      }

      if (!sellerId) continue; // Sécurité

      // Vérifie si déjà payé pour éviter double crédit
      const existingPayout = await SellerPayout.findOne({
        order: order._id,
        product: it.product,
        seller: sellerId,
      });
      if (existingPayout) continue; // ✅ Déjà traité, on passe

      let pct =
        categoryKey != null && pctCache.has(categoryKey)
          ? pctCache.get(categoryKey)
          : await getCommissionPctForProduct({ category: categoryKey });
      if (categoryKey != null) pctCache.set(categoryKey, pct);

      const qty = Math.max(1, Number(it.qty) || 1);
      const unitAmountCents = toCents(it.unitAmount);
      const grossAmountCents = unitAmountCents * qty;
      const commissionAmountCents = Math.round((grossAmountCents * pct) / 100);
      const netAmountCents = grossAmountCents - commissionAmountCents;
      const netAmountUnit = toUnits(netAmountCents);

      // 1. Création Payout (Historique)
      await SellerPayout.create({
        order: order._id,
        product: it.product,
        seller: sellerId,
        shop: shopId || null,
        buyer: buyerId,
        qty,
        currency,
        commissionRate: pct,
        unitAmountCents,
        grossAmountCents,
        commissionAmountCents,
        netAmountCents,
        unitAmount: toUnits(unitAmountCents),
        grossAmount: toUnits(grossAmountCents),
        commissionAmount: toUnits(commissionAmountCents),
        netAmount: netAmountUnit,
        status: "available",
      });

      // 2. Création Commission Admin
      await AdminCommission.create({
        order: order._id,
        product: it.product,
        seller: sellerId,
        buyer: buyerId,
        shop: shopId || null,
        qty,
        currency,
        commissionRate: pct,
        commissionAmountCents,
        commissionAmount: toUnits(commissionAmountCents),
      });

      // 3. ✅ VERSEMENT : Crédit du solde vendeur
      await User.findByIdAndUpdate(sellerId, {
        $inc: { sellerBalance: netAmountUnit },
      });

      console.log(`[PAYOUT] +${netAmountUnit}$ ajoutés au vendeur ${sellerId}`);
    } catch (e) {
      console.error("[payouts] line error:", e?.stack || e);
    }
  }
}

module.exports = { ensurePayoutsForOrder };
