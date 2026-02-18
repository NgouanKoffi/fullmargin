// backend/src/models/communityMember.model.js
"use strict";

const mongoose = require("mongoose");

const communityMemberSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // 👇 nouveau : on garde la trace
    status: {
      type: String,
      enum: ["active", "left"],
      default: "active",
      index: true,
    },
    leftAt: {
      type: Date,
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

/**
 * Un user ne peut être membre ACTIF qu'une seule fois d'une communauté.
 * On fait un index partiel sur status=active.
 * (il pourra donc y avoir d’anciennes lignes status=left)
 */
communityMemberSchema.index(
  { communityId: 1, userId: 1 },
  {
    unique: true,
    name: "cm_unique_active_member_per_community",
    partialFilterExpression: { status: "active" },
  }
);

module.exports = mongoose.model("CommunityMember", communityMemberSchema);
