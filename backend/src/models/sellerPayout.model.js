// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\sellerPayout.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const SellerPayoutSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

    qty: { type: Number, min: 1, required: true },

    currency: { type: String, default: "usd" },

    unitAmountCents: { type: Number, min: 0, required: true },
    grossAmountCents: { type: Number, min: 0, required: true },
    commissionRate: { type: Number, min: 0, default: 0 }, // %
    commissionAmountCents: { type: Number, min: 0, required: true },
    netAmountCents: { type: Number, min: 0, required: true },

    unitAmount: { type: Number, min: 0, required: true },
    grossAmount: { type: Number, min: 0, required: true },
    commissionAmount: { type: Number, min: 0, required: true },
    netAmount: { type: Number, min: 0, required: true },

    status: {
      type: String,
      enum: ["pending", "available", "paid", "canceled", "reversed"],
      default: "available",
      index: true,
    },
    paidOutAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// idempotence par commande/produit/vendeur
SellerPayoutSchema.index({ order: 1, product: 1, seller: 1 }, { unique: true });

module.exports = model("SellerPayout", SellerPayoutSchema);
