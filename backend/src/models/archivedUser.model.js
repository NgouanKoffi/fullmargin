// backend/src/models/archivedUser.model.js
const mongoose = require("mongoose");

const archivedUserSchema = new mongoose.Schema(
  {
    // Snapshot utilisateur
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true, // ❌ on retire index:true ici
    },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    roles: { type: [String], default: ["user"] },
    isActive: { type: Boolean, default: true },
    localEnabled: { type: Boolean, default: false },

    googleId: {
      type: String,
      trim: true, // ❌ on retire index:true/sparse ici
    },
    twoFAEnabled: { type: Boolean, default: true },
    referralCode: { type: String },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Liens d’origine / meta
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      // ❌ on retire index:true inline
    },
    originalCreatedAt: { type: Date },
    originalUpdatedAt: { type: Date },

    // Archivage
    archivedAt: { type: Date, default: Date.now },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

/* ===== Index centralisés ===== */
// ⚠️ En archive, on NE met PAS unique sur email (plusieurs snapshots possibles pour la même adresse)
archivedUserSchema.index({ email: 1 }, { name: "a_email" });
archivedUserSchema.index({ googleId: 1 }, { sparse: true, name: "a_googleId" });
archivedUserSchema.index({ originalUserId: 1 }, { name: "a_originalUserId" });
archivedUserSchema.index({ archivedAt: -1 }, { name: "a_archivedAt_desc" });

module.exports = mongoose.model("ArchivedUser", archivedUserSchema);
