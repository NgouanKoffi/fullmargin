// backend/src/models/communityPostLike.model.js
const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Un seul like par (post, user)
likeSchema.index(
  { postId: 1, userId: 1 },
  { unique: true, name: "cpl_unique" }
);

module.exports = mongoose.model("CommunityPostLike", likeSchema);
