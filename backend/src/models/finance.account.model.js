// backend/src/models/finance.account.model.js
const mongoose = require("mongoose");

const FinanceAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    currency: {
      type: String,
      enum: [
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
        "BTC",
        "ETH",
        "BNB",
        "USDT",
        "FCFA",
      ],
      default: "XOF",
      index: true,
    },
    initial: { type: Number, default: 0 },
    description: { type: String, default: "", maxlength: 2000 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

FinanceAccountSchema.index({ user: 1, updatedAt: -1, _id: -1 });

module.exports = mongoose.model("FinanceAccount", FinanceAccountSchema);
