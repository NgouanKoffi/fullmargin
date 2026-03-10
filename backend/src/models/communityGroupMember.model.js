// backend/src/models/communityGroupMember.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommunityGroupMemberSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: () => new Date(),
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// un utilisateur ne peut avoir qu'une ligne par groupe
CommunityGroupMemberSchema.index(
  { group: 1, user: 1 },
  { unique: true, name: "group_user_unique" }
);

// pratique pour compter les membres actifs d'un groupe
CommunityGroupMemberSchema.index(
  { group: 1, leftAt: 1 },
  { name: "group_active_members" }
);

module.exports =
  mongoose.models.CommunityGroupMember ||
  mongoose.model(
    "CommunityGroupMember",
    CommunityGroupMemberSchema,
    "community_group_members"
  );
