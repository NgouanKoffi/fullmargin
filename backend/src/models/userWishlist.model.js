// backend/src/models/userWishlist.model.js
const mongoose = require("mongoose");

const UserWishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ❌ pas de unique/index inline
    },
    ids: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ un seul endroit
UserWishlistSchema.index({ user: 1 }, { unique: true, name: "uw_user_unique" });

module.exports = mongoose.model("UserWishlist", UserWishlistSchema);
