// backend/src/models/communityPost.model.js
const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    publicId: { type: String, default: "" }, // pour suppression éventuelle
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔐 visibilité du post
    // private  = visible seulement pour les membres / owner / auteur
    // public   = visible partout (feed global, non connectés, etc.)
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      index: true,
    },

    content: { type: String, trim: true, maxlength: 10000, default: "" },
    media: { type: [mediaSchema], default: [] },

    // Publication / Programmation
    // Compat : anciens posts sans isPublished => considérés publiés
    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: null, index: true },
    scheduledAt: { type: Date, default: null, index: true },

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // soft delete
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ------------------------- Indexes utilitaires ------------------------- */
// Liste par communauté (tri récent)
postSchema.index({ communityId: 1, createdAt: -1 }, { name: "cp_byCommunity" });

// Filtrage des listes publiques (publiés) + tri récent
postSchema.index(
  { communityId: 1, isPublished: 1, createdAt: -1 },
  { name: "cp_feed_public" }
);

// Visibilité + publication (utile pour le feed public)
postSchema.index(
  { visibility: 1, isPublished: 1, createdAt: -1 },
  { name: "cp_visibility_published" }
);

// Accélère la recherche des posts à publier (scheduler)
postSchema.index(
  { isPublished: 1, scheduledAt: 1 },
  {
    partialFilterExpression: { isPublished: false, deletedAt: null },
    name: "cp_dueSchedule",
  }
);

// Marquage soft-delete (déjà indexé via deletedAt)
postSchema.index({ deletedAt: 1 }, { name: "cp_deleted" });

module.exports = mongoose.model("CommunityPost", postSchema);
