// models/tempReset.model.js
const mongoose = require("mongoose");

const tempResetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true }, // ❌ pas d'index inline
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // ❌ pas d'index inline
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ Index centralisés
tempResetSchema.index({ email: 1 }, { name: "tr_email" });
tempResetSchema.index({ user: 1 }, { name: "tr_user" });
tempResetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "tr_ttl_expiresAt" }
);

module.exports = mongoose.model("TempReset", tempResetSchema);
