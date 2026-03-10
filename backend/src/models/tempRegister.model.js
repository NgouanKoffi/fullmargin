// models/tempRegister.model.js
const mongoose = require("mongoose");

const tempRegisterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // UUID (clé primaire)
    email: { type: String, required: true, lowercase: true, trim: true }, // ❌ pas d'index inline
    fullName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },

    // 2FA
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // ❌ pas d'index inline
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },

    // 🔗 Affiliation (optionnel)
    referralCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

// ✅ Index centralisés
tempRegisterSchema.index({ email: 1 }, { name: "treg_email" });
tempRegisterSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "treg_ttl_expiresAt" }
);

module.exports = mongoose.model("TempRegister", tempRegisterSchema);
