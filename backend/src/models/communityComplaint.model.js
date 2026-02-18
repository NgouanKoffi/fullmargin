const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Plaintes / signalements.
 * Modération par le propriétaire de la communauté.
 */
const CommunityComplaintSchema = new Schema(
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

    subjectType: {
      type: String,
      enum: ["review", "user", "post", "other"],
      default: "other",
    },
    subjectId: { type: String, default: "" }, // id arbitraire (reviewId, userId, etc.)

    category: {
      type: String,
      enum: ["abuse", "spam", "copyright", "other"],
      default: "other",
    },
    message: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "in_review", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    resolutionNote: { type: String, default: "" },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" }, // owner/modérateur
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityComplaint", CommunityComplaintSchema);
