// backend/src/models/accountTransaction.model.js
const mongoose = require("mongoose");

const accountTransactionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    type: { type: String, enum: ["deposit", "withdrawal"], required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true }, // Format "YYYY-MM-DD"
    note: { type: String, default: "" },
    deletedAt: { type: Date, default: null }, // Pour la suppression logique (soft delete)
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccountTransaction", accountTransactionSchema);