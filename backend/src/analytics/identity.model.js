// backend/src/analytics/identity.model.js
const mongoose = require("mongoose");

const AnalyticsIdentitySchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    visitorId: { type: String, required: true, index: true },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt:  { type: Date, default: Date.now },
    seen:        { type: Number, default: 1 },

    ua:     { type: String, default: "" },
    ipHash: { type: String, default: "" },
  },
  { versionKey: false }
);

// un user peut avoir plusieurs visitorId (multi-device), mais chaque couple est unique
AnalyticsIdentitySchema.index({ user: 1, visitorId: 1 }, { unique: true });

module.exports = mongoose.model("AnalyticsIdentity", AnalyticsIdentitySchema);