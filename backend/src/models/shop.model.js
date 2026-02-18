// backend/src/models/shop.model.js
const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ❌
    name: { type: String, required: true, trim: true, maxlength: 30 },
    desc: { type: String, required: true, trim: true, maxlength: 200 },
    signature: { type: String, required: true, trim: true, maxlength: 20 },
    avatarUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    slug: { type: String, trim: true }, // ❌ pas d'index inline
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 1 boutique active par user
ShopSchema.index(
  { user: 1, deletedAt: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
    name: "shop_user_unique_active",
  }
);
// slug consultable
ShopSchema.index({ slug: 1 }, { name: "shop_slug" });

function toSlug(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

ShopSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    const base = toSlug(this.name || "ma-boutique");
    this.slug = base || "ma-boutique";
  }
  next();
});

module.exports = mongoose.model("Shop", ShopSchema);
