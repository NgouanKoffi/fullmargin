// backend/src/models/strategy.model.js
const mongoose = require("mongoose");

const StrategySchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // ❌ pas d'index inline
    name: { type: String, required: true, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unicité par user tant que non supprimée
StrategySchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
    name: "st_user_name_unique_active",
  }
);

module.exports = mongoose.model("Strategy", StrategySchema);
