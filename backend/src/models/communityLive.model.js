const mongoose = require("mongoose");

const CommunityLiveSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    // début "prévu" ou réel
    startsAt: { type: Date },

    // fin programmée (pour auto-stop)
    plannedEndAt: { type: Date },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // nom de salle pour Jitsi (ou autre service)
    roomName: { type: String, required: true },

    // true = accessible à tous les utilisateurs connectés
    // false = uniquement membres de la communauté
    isPublic: { type: Boolean, default: false },

    // fin réelle
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityLive", CommunityLiveSchema);
