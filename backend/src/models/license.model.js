// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\license.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const LicenseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },

    provider: { type: String, default: "secure.fullmargin.net" },

    keyType: { type: String, default: "robot" }, // ex: robot
    robotName: { type: String, default: "" }, // ex: product.title
    licenseKey: { type: String, default: "", index: true },
    expiresAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["issued", "failed", "renewed"],
      default: "issued",
      index: true,
    },

    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

// Une licence par (order, product) (idempotence)
LicenseSchema.index(
  { order: 1, product: 1 },
  { unique: true, name: "lic_unique_order_product" }
);

module.exports = model("License", LicenseSchema);
