// backend/src/models/userAudit.model.js
const mongoose = require("mongoose");

const userAuditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ❌ pas d'index inline
    },
    type: { type: String, required: true },
    ipHash: { type: String, default: "" },
    ua: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// tri / recherche par user récent
userAuditSchema.index(
  { user: 1, createdAt: -1 },
  { name: "ua_user_created_desc" }
);

module.exports = mongoose.model("UserAudit", userAuditSchema);
