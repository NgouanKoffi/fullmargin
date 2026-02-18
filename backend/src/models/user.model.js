// backend/src/models/user.model.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // 🔒 Masqué par défaut
    passwordHash: { type: String, required: true, select: false },

    // 🖼️ URLs d'images
    avatarUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },

    roles: { type: [String], default: ["user"] },
    isActive: { type: Boolean, default: true },

    // ⚙️ Contrôle des méthodes d'auth
    localEnabled: { type: Boolean, default: false },

    // 🔗 OAuth Google
    googleId: { type: String, trim: true },

    // 🔐 2FA
    twoFAEnabled: { type: Boolean, default: true },

    // 💰 PORTEFEUILLES (INDISPENSABLE POUR LES RETRAITS)
    sellerBalance: { type: Number, default: 0 }, // Solde Boutique
    communityBalance: { type: Number, default: 0 }, // Solde Formateur
    affiliationBalance: { type: Number, default: 0 }, // Solde Affiliation

    // 🧩 Affiliation
    referralCode: { type: String, trim: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

/* ===== Index centralisés ===== */
userSchema.index({ email: 1 }, { unique: true, name: "u_email" });
userSchema.index({ googleId: 1 }, { sparse: true, name: "u_googleId" });
userSchema.index(
  { referralCode: 1 },
  { unique: true, sparse: true, name: "u_referralCode" },
);
userSchema.index({ referredBy: 1 }, { name: "u_referredBy" });

module.exports = mongoose.model("User", userSchema);
