// backend/src/models/withdrawal.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const WithdrawalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reference: { type: String, required: true, unique: true },

    amountGross: { type: Number, required: true },
    commission: { type: Number, required: true },
    amountNet: { type: Number, required: true },

    method: { type: String, enum: ["USDT", "BTC", "BANK"], required: true },

    paymentDetails: {
      cryptoAddress: String,
      bankName: String,
      bankIban: String,
      bankSwift: String,
      bankCountry: String,
    },

    // ✅ snapshot pour restaurer
    balancesSnapshot: {
      seller: { type: Number, required: true },
      community: { type: Number, required: true },
      affiliation: { type: Number, required: true },
    },

    // ✅ statuts complets
    status: {
      type: String,
      enum: ["PENDING", "VALIDATED", "PAID", "REJECTED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    processedAt: { type: Date, default: null },
    payoutRef: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    failureReason: { type: String, default: null },

    invoiceUrl: { type: String, default: null },
    proof: { type: String, default: null }, // URL to uploaded proof (image/PDF)
  },
  { timestamps: true },
);

WithdrawalSchema.index({ user: 1, createdAt: -1 });
WithdrawalSchema.index({ user: 1, status: 1 });

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", WithdrawalSchema, "withdrawals");
