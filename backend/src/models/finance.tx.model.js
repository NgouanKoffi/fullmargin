const mongoose = require("mongoose");

const FinanceTxSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceAccount",
      required: true,
    },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    recurrence: {
      type: String,
      enum: ["fixe", "mensuel"],
      default: "fixe",
    },
    detail: {
      type: String,
      enum: [
        // cœur historique
        "epargne",
        "assurance",
        "retrait",
        "dette",
        "investissement",
        "autre",

        // détails “fréquents” qu’on veut VRAIMENT stocker en base
        "loyer",
        "alimentation",
        "transport",
        "sante",
        "education",
        "loisirs",
        "impots_taxes",
        "abonnement",
        "frais_bancaires",
        "cadeaux_dons",
        "entretien_reparation",
        "achat_materiel",
        "frais_service",
        "voyage_deplacement",
        "frais_professionnels",
      ],
      default: "autre",
    },
    comment: { type: String, default: "", maxlength: 2000 },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinanceTx",
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Index centralisés
FinanceTxSchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "ftx_user_updated_desc" }
);
FinanceTxSchema.index({ account: 1 }, { name: "ftx_account" });
FinanceTxSchema.index({ type: 1 }, { name: "ftx_type" });
FinanceTxSchema.index({ date: 1 }, { name: "ftx_date" });
FinanceTxSchema.index({ recurrence: 1 }, { name: "ftx_recurrence" });
FinanceTxSchema.index({ detail: 1 }, { name: "ftx_detail" });
FinanceTxSchema.index({ parentId: 1 }, { name: "ftx_parentId" });
FinanceTxSchema.index({ deletedAt: 1 }, { name: "ftx_deletedAt" });

module.exports = mongoose.model("FinanceTx", FinanceTxSchema);
