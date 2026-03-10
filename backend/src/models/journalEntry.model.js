// backend/src/models/journalEntry.model.js
const mongoose = require("mongoose");

const JournalEntrySchema = new mongoose.Schema(
  {
    user: { type: String, required: true },

    // Références / libellés
    accountId: { type: String, default: "" },
    accountName: { type: String, default: "" },
    marketId: { type: String, default: "" },
    marketName: { type: String, default: "" },
    strategyId: { type: String, default: "" },
    strategyName: { type: String, default: "" },

    // Données métier
    order: { type: String, enum: ["Buy", "Sell", ""], default: "" },
    lot: { type: String, default: "" },

    result: { type: String, enum: ["Gain", "Perte", "Nul", ""], default: "" },
    detail: { type: String, default: "" },

    invested: { type: String, default: "" },
    resultMoney: { type: String, default: "" },
    resultPct: { type: String, default: "" },

    respect: { type: String, enum: ["Oui", "Non", ""], default: "" },
    duration: { type: String, default: "" },

    timeframes: { type: [String], default: [] },
    session: {
      type: String,
      enum: ["london", "newyork", "asiatique", ""],
      default: "",
    },

    comment: { type: String, default: "" },

    // anciens champs (compat)
    imageDataUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },

    // 🆕 tableau d’images hébergées (Cloudinary ou autres)
    images: { type: [String], default: [] },

    date: { type: String, default: "" },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// index pour la liste
JournalEntrySchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "je_user_updated_desc" }
);

// index texte
JournalEntrySchema.index(
  {
    user: 1,
    accountName: "text",
    marketName: "text",
    strategyName: "text",
    comment: "text",
    detail: "text",
  },
  { name: "je_text_search" }
);

module.exports = mongoose.model("JournalEntry", JournalEntrySchema);
