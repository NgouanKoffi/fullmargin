// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\promoCode.model.js
const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // ❗️Pas d'unique ici : l’unicité se fait via des indexes composés plus bas.
    },

    type: {
      type: String,
      enum: ["percent", "amount"],
      default: "percent",
      required: true,
    },
    value: { type: Number, required: true, min: 1 },

    // validité
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, default: null },

    // limites
    maxUse: { type: Number, default: null }, // null = illimité
    used: { type: Number, default: 0 },

    active: { type: Boolean, default: true },

    // portée
    scope: {
      type: String,
      enum: ["global", "category", "product", "shop"],
      default: "global",
      required: true,
      index: true,
    },
    categoryKey: { type: String, default: null, index: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceProduct",
      default: null,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceShop",
      default: null,
      index: true,
    },

    // audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "marketplace_promo_codes" }
);

/* =========================
   Indexes d’unicité par portée (soft-deletes ignorés)
   ========================= */

// GLOBAL : (code, scope) unique quand scope="global"
PromoCodeSchema.index(
  { code: 1, scope: 1 },
  {
    unique: true,
    name: "uniq_code_scope_global",
    partialFilterExpression: { scope: "global", deletedAt: null },
  }
);

// CATEGORY : (code, scope, categoryKey) unique quand scope="category"
PromoCodeSchema.index(
  { code: 1, scope: 1, categoryKey: 1 },
  {
    unique: true,
    name: "uniq_code_scope_category_categoryKey",
    partialFilterExpression: {
      scope: "category",
      categoryKey: { $exists: true, $ne: null },
      deletedAt: null,
    },
  }
);

// PRODUCT : (code, scope, productId) unique quand scope="product"
PromoCodeSchema.index(
  { code: 1, scope: 1, productId: 1 },
  {
    unique: true,
    name: "uniq_code_scope_product_productId",
    partialFilterExpression: {
      scope: "product",
      productId: { $exists: true, $ne: null },
      deletedAt: null,
    },
  }
);

// SHOP : (code, scope, shopId) unique quand scope="shop"
PromoCodeSchema.index(
  { code: 1, scope: 1, shopId: 1 },
  {
    unique: true,
    name: "uniq_code_scope_shop_shopId",
    partialFilterExpression: {
      scope: "shop",
      shopId: { $exists: true, $ne: null },
      deletedAt: null,
    },
  }
);

module.exports =
  mongoose.models.MarketplacePromoCode ||
  mongoose.model("MarketplacePromoCode", PromoCodeSchema);
