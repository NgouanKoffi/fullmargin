// backend/src/models/market.model.js
const mongoose = require("mongoose");

const MarketSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // ❌ pas d'index inline
    name: { type: String, required: true, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Index centralisés
MarketSchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
    name: "mk_user_name_unique_active",
  }
);
MarketSchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "mk_user_updated_desc" }
);

module.exports = mongoose.model("Market", MarketSchema);
