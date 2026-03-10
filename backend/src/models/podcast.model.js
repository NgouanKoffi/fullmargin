// backend/src/models/podcast.model.js
const mongoose = require("mongoose");

const PodcastSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ❌ pas d'index inline

    title: { type: String, required: true },
    author: { type: String, default: "" },
    category: { type: String, required: true },
    html: { type: String, default: "" },

    coverUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    duration: { type: Number, default: null },

    language: { type: String, enum: ["fr", "en"], default: "fr" }, // ❌
    status: {
      type: String,
      enum: ["brouillon", "publie"],
      default: "brouillon",
    }, // ❌
    publishedAt: { type: Date, default: null },

    likedBy: { type: [String], default: [] },
    dislikedBy: { type: [String], default: [] },
    savedBy: { type: [String], default: [] },
    viewedBy: { type: [String], default: [] },

    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ❌
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ❌
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ❌
    deletedAt: { type: Date, default: null }, // ❌
  },
  { timestamps: true }
);

// ✅ Index centralisés
PodcastSchema.index(
  { user: 1, deletedAt: 1, updatedAt: -1, _id: -1 },
  { name: "pod_user_deleted_updated_desc" }
);
PodcastSchema.index(
  { status: 1, language: 1, updatedAt: -1, _id: -1 },
  { name: "pod_status_lang_updated_desc" }
);
PodcastSchema.index({ createdBy: 1 }, { name: "pod_createdBy" });
PodcastSchema.index({ updatedBy: 1 }, { name: "pod_updatedBy" });
PodcastSchema.index({ deletedBy: 1 }, { name: "pod_deletedBy" });
PodcastSchema.index({ deletedAt: 1 }, { name: "pod_deletedAt" });

module.exports =
  mongoose.models.Podcast || mongoose.model("Podcast", PodcastSchema);
