// backend/src/models/communityComment.model.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },
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
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityComment",
      default: null,
      index: true,
    },

    text: { type: String, trim: true, maxlength: 5000, required: true },

    // Compteurs pratiques
    repliesCount: { type: Number, default: 0 },

    // Soft delete (on garde la trace si besoin d’audit)
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

/* Index utiles */
commentSchema.index({ postId: 1, createdAt: -1 }, { name: "cc_byPost" });
commentSchema.index({ parentId: 1, createdAt: 1 }, { name: "cc_byParent" });
commentSchema.index({ authorId: 1, createdAt: -1 }, { name: "cc_byAuthor" });

module.exports = mongoose.model("CommunityComment", commentSchema);
