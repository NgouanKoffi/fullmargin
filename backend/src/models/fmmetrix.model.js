// backend/src/models/fmmetrix.model.js
const mongoose = require("mongoose");

const FmMetrixSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    startedAt: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    raw: { type: Object }, // on garde tout le payload Stripe si tu veux
  },
  { timestamps: true }
);

module.exports = mongoose.model("FmMetrix", FmMetrixSchema);
