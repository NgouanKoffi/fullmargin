// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\communityPrivateThread.model.js
"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Thread privé entre le propriétaire d'une communauté et UN membre.
 * Un thread = (communityId, ownerId, memberId) unique.
 */
const CommunityPrivateThreadSchema = new Schema(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // pour plus tard : se baser dessus pour trier les discussions
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
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

// Un seul thread privé par couple (owner, member, community)
CommunityPrivateThreadSchema.index(
  { communityId: 1, ownerId: 1, memberId: 1 },
  {
    unique: true,
    name: "cpriv_unique_thread_per_member",
  }
);

module.exports =
  mongoose.models.CommunityPrivateThread ||
  mongoose.model(
    "CommunityPrivateThread",
    CommunityPrivateThreadSchema,
    "community_private_threads"
  );
