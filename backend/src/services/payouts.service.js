// backend/src/services/payouts.service.js
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const SellerPayout = require("../models/sellerPayout.model");
const AdminCommission = require("../models/adminCommission.model");
const User = require("../models/user.model");

const toCents = (usd) => Math.round(Number(usd || 0) * 100);
const toUnits = (cents) => Math.round(Number(cents || 0)) / 100;

// ✅ On fixe la commission par défaut à 0%
const DEFAULT_PCT = 0;

async function getCommissionPctForProduct({ category }) {
  // ✅ FIX: On retourne toujours 0%, on ne cherche plus dans les catégories
  return 0;
}

async function ensurePayoutsForOrder(orderOrId) {
  const Order = require("../models/order.model");

  const order =
    typeof orderOrId === "string"
      ? await Order.findById(orderOrId).lean()
      : orderOrId?.toObject?.() || orderOrId;

  if (!order || order.status !== "succeeded") return;

  const currency = String(order.currency || "usd").toLowerCase();

  // ✅ Extraction de l'ID proprement quoi qu'il arrive
  let buyerId = null;
  if (order.user) {
    if (typeof order.user === "object") {
      buyerId = order.user._id || order.user.id || null;
    } else {
      buyerId = order.user;
    }
  }
  buyerId = buyerId ? String(buyerId) : null;

  const orderIdStr = String(order._id || order.id);

  for (const it of order.items || []) {
    try {
      const productIdStr = String(it.product);
      let sellerId = it.seller ? String(it.seller) : null;
      let shopId = it.shop ? String(it.shop) : null;

      if (!sellerId) {
        const product = await Product.findById(productIdStr)
          .select("_id user shop")
          .lean();
        if (product) {
          sellerId = product.user ? String(product.user) : null;
          shopId = product.shop ? String(product.shop) : null;
        }
      }

      if (!sellerId) {
        console.warn(
          `[Payouts] Ligne ignorée: pas de vendeur trouvé pour le produit ${productIdStr}`,
        );
        continue;
      }

      // 🚨 Vérification pour ne pas doubler le solde
      const existingPayout = await SellerPayout.findOne({
        order: orderIdStr,
        product: productIdStr,
        seller: sellerId,
      });

      // ✅ FIX MAJEUR : On force la commission à 0%
      const pct = 0;

      const qty = Math.max(1, Number(it.qty) || 1);
      const unitAmountCents = toCents(it.unitAmount);
      const grossAmountCents = unitAmountCents * qty;
      const commissionAmountCents = 0; // 🔥 Commission à 0 !
      const netAmountCents = grossAmountCents; // 🔥 Le vendeur gagne 100% !
      const netAmountUnit = toUnits(netAmountCents);

      // 1. 🧾 Création Payout Vendeur
      await SellerPayout.findOneAndUpdate(
        { order: orderIdStr, product: productIdStr, seller: sellerId },
        {
          $set: {
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
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // 2. 🏛️ Commission Admin (0$ enregistré pour les stats de ventes)
      await AdminCommission.findOneAndUpdate(
        { order: orderIdStr, product: productIdStr },
        {
          $set: {
            seller: sellerId,
            buyer: buyerId,
            shop: shopId || null,
            qty,
            currency,
            commissionRate: pct,
            commissionAmountCents,
            commissionAmount: toUnits(commissionAmountCents),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // 3. 💰 CREDIT DE LA BALANCE
      if (!existingPayout) {
        await User.updateOne(
          { _id: new mongoose.Types.ObjectId(sellerId) },
          { $inc: { sellerBalance: netAmountUnit } },
          { strict: false },
        );
        console.log(
          `[PAYOUT] +${netAmountUnit}$ ajoutés au vendeur ${sellerId} (0% de frais)`,
        );
      } else {
        console.log(
          `[PAYOUT] Payout déjà existant pour ${sellerId}, solde non doublé.`,
        );
      }
    } catch (e) {
      console.error(
        `[payouts] Ligne erreur pour la commande ${orderIdStr}:`,
        e,
      );
    }
  }
}

module.exports = { ensurePayoutsForOrder };
