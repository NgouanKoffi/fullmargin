// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\communityGroup.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommunityGroupSchema = new Schema(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    // 🔐 Visibilité du groupe : public ou privé
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    accessType: {
      type: String,
      enum: ["free", "course"],
      default: "free",
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    coverUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // 🔴 NOUVEAU : quand true → seuls les admins peuvent envoyer des messages
    onlyAdminsCanPost: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

CommunityGroupSchema.index(
  { community: 1, deletedAt: 1, createdAt: -1 },
  { name: "group_by_community_active" }
);

module.exports =
  mongoose.models.CommunityGroup ||
  mongoose.model("CommunityGroup", CommunityGroupSchema, "community_groups");
