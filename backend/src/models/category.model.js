// backend/src/models/category.model.js
const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      // ❌ retire unique: true ici (on garde l'index unique partiel plus bas)
    },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    commissionPct: { type: Number, default: 0, min: 0, max: 100 },
    featured: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unicité uniquement pour les catégories actives (deletedAt:null)
CategorySchema.index(
  { key: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
// Index utiles
CategorySchema.index({ deletedAt: 1, featured: 1 });

module.exports = mongoose.model("Category", CategorySchema);
