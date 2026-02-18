// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\adminCommission.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AdminCommissionSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },

    qty: { type: Number, min: 1, required: true },
    currency: { type: String, default: "usd" },
    commissionRate: { type: Number, min: 0, default: 0 }, // %

    commissionAmountCents: { type: Number, min: 0, required: true },
    commissionAmount: { type: Number, min: 0, required: true },
  },
  { timestamps: true }
);

AdminCommissionSchema.index({ order: 1, product: 1 }, { unique: true });

module.exports = model("AdminCommission", AdminCommissionSchema);
