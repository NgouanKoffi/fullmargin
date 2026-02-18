// backend/src/models/presenceSession.model.js
const mongoose = require("mongoose");

const presenceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ❌
    status: { type: String, enum: ["online", "offline"], default: "online" }, // ❌
    startedAt: { type: Date, default: () => new Date() }, // ❌
    lastSeenAt: { type: Date, default: () => new Date() }, // ❌
    endedAt: { type: Date, default: null },

    durationMs: { type: Number, default: 0 },
    endReason: { type: String, default: "" },

    email: { type: String, default: "" }, // ❌
    method: { type: String, default: "" },
    success: { type: Boolean, default: true },
    ipHash: { type: String, default: "" }, // ❌
    ua: { type: String, default: "" },

    clientId: { type: String, default: "" },
  },
  { timestamps: false, versionKey: false }
);

// ✅ Index centralisés
presenceSessionSchema.index(
  { user: 1, startedAt: -1 },
  { name: "ps_user_started_desc" }
);
presenceSessionSchema.index({ status: 1 }, { name: "ps_status" });
presenceSessionSchema.index({ startedAt: -1 }, { name: "ps_started_desc" });
presenceSessionSchema.index({ lastSeenAt: -1 }, { name: "ps_lastSeen_desc" });
presenceSessionSchema.index({ email: 1 }, { name: "ps_email" });
presenceSessionSchema.index({ ipHash: 1 }, { name: "ps_ipHash" });

module.exports = mongoose.model("PresenceSession", presenceSessionSchema);
