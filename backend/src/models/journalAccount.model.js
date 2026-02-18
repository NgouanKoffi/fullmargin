// backend/src/models/journalAccount.model.js
const mongoose = require("mongoose");

/** FIAT côté serveur */
const SERVER_FIAT_CODES = [
  "USD",
  "EUR",
  "XOF",
  "XAF",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "CHF",
  "NGN",
  "ZAR",
  "MAD",
  "INR",
  "AED",
  "GHS",
  "KES",
  "FCFA",
];

function normalizeCurrencyModel(c) {
  const v = String(c || "")
    .toUpperCase()
    .trim();
  if (v === "FCFA") return "XOF";
  if (v === "FCFA_BEAC") return "XAF";
  return SERVER_FIAT_CODES.includes(v) ? v : "USD";
}

const JournalAccountSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // ❌ pas d'index inline
    name: { type: String, required: true, trim: true },
    currency: {
      type: String,
      enum: SERVER_FIAT_CODES,
      default: "USD",
      set: normalizeCurrencyModel,
    },
    initial: { type: Number, default: 0 },
    description: { type: String, default: "" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Index centralisés
JournalAccountSchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
    name: "ja_user_name_unique_active",
  }
);
// (optionnel) pagination rapide par user
JournalAccountSchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "ja_user_updated_desc" }
);

module.exports = mongoose.model("JournalAccount", JournalAccountSchema);
module.exports.SERVER_FIAT_CODES = SERVER_FIAT_CODES;
module.exports.normalizeCurrencyModel = normalizeCurrencyModel;
