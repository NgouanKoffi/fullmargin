//analytics\models.js

const mongoose = require("mongoose");

const AnalyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["pageview", "leave", "consent"], required: true },

    path: String,
    referrer: String,
    url: String,
    search: String,
    title: String,
    lang: String,
    tz: String,
    screen: { w: Number, h: Number, dpr: Number },

    sessionId: { type: String, index: true },
    visitorId: { type: String, index: true },

    ua: String,
    hints: mongoose.Schema.Types.Mixed,

    ipHash: String,
    cookieConsent: { type: String, enum: ["accepted", "declined", "unknown"], default: "unknown" },

    durationMs: Number,

    /* ↓↓↓ champs enrichis (facultatifs) ↓↓↓ */
    country: { type: String, uppercase: true },      // ex: "FR"
    deviceType: { type: String },                    // "desktop" | "mobile" | "tablet" | "bot" | "other"
    browser: { type: String },                       // "Chrome"…
    os: { type: String },                            // "Windows"…

    dedupeKey: { type: String, unique: true, sparse: true },

    firstAt: { type: Date, default: Date.now },
    lastAt: { type: Date, default: Date.now },
  },
  { minimize: true }
);

AnalyticsEventSchema.index({ type: 1, path: 1, firstAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, firstAt: -1 });
AnalyticsEventSchema.index({ country: 1, firstAt: -1 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", AnalyticsEventSchema);
module.exports = { AnalyticsEvent };
