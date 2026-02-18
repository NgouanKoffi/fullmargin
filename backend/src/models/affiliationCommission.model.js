// backend/src/models/affiliationCommission.model.js
const mongoose = require("mongoose");

const AffiliationCommissionSchema = new mongoose.Schema(
  {
    // celui qui touche la commission (le parrain)
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // celui qui a payé (le filleul)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // lien vers la ligne FM Metrix qui a déclenché
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FmMetrixSubscription",
      required: true,
      index: true,
    },

    // 1 = 1er mois (15%), 2 = 2e mois (9%)
    monthIndex: {
      type: Number,
      required: true,
      enum: [1, 2],
    },

    // taux appliqué (0.15 ou 0.09)
    rate: {
      type: Number,
      required: true,
    },

    // montant en CENTIMES (même format que Stripe)
    amount: {
      type: Number,
      required: true,
    },

    // ex: "usd"
    currency: {
      type: String,
      default: "usd",
    },

    // pour savoir d'où ça vient
    source: {
      type: String,
      default: "fm-metrix",
    },

    // on garde le Stripe brut aussi au cas où
    raw: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AffiliationCommission",
  AffiliationCommissionSchema
);
