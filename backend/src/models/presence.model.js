const mongoose = require("mongoose");

const PresenceSchema = new mongoose.Schema(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    status:         { type: String, enum: ["online", "away", "offline"], default: "offline", index: true },

    lastPingAt:     { type: Date, default: Date.now, index: true },
    sessionStartAt: { type: Date, default: null },
    lastOnlineAt:   { type: Date, default: null },

    totalOnlineMs:  { type: Number, default: 0 },

    // session active (PresenceSession._id) sinon null
    activeSession:  { type: mongoose.Schema.Types.ObjectId, ref: "PresenceSession", default: null },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Presence", PresenceSchema);