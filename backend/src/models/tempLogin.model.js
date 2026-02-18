// models/tempLogin.model.js
const mongoose = require("mongoose");

const tempLoginSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // OK : pas d'index inline
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ Index centralisés
tempLoginSchema.index({ user: 1 }, { name: "tlogin_user" });
tempLoginSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "tlogin_ttl_expiresAt" }
);

module.exports = mongoose.model("TempLogin", tempLoginSchema);
