// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\communityReview.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Un avis par (userId, communityId).
 * Si l'utilisateur ré-édite son avis, on met à jour l'agrégat de la communauté.
 */
const CommunityReviewSchema = new Schema(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      index: true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    hidden: { type: Boolean, default: false }, // modération (owner)
  },
  { timestamps: true }
);

CommunityReviewSchema.index({ communityId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("CommunityReview", CommunityReviewSchema);
