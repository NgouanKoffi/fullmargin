// backend/src/models/fmmetrixSubscription.model.js
const mongoose = require("mongoose");

const FmMetrixSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ex: "active", "expired", "canceled"
    status: {
      type: String,
      default: "active",
      index: true,
    },

    // période couverte par le paiement
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    // infos stripe si dispo
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripeSessionId: { type: String },

    // on garde le payload brut pour déboguer
    raw: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FmMetrixSubscription",
  FmMetrixSubscriptionSchema
);
