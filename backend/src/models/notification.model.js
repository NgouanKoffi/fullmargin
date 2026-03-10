// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\notification.model.js
"use strict";

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // ex: "community_request_received", "community_request_approved", "community_request_rejected"
    kind: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    // pour relier à la communauté concernée
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      index: true,
      default: null,
    },
    // pour relier à la demande
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityAccessRequest",
      index: true,
      default: null,
    },
    // pour relier directement à un groupe
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityGroup",
      index: true,
      default: null,
    },
    // pour relier directement à une formation
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
      default: null,
    },
    // petit payload libre si tu veux afficher un message
    payload: {
      type: Object,
      default: {},
    },
    // est-ce que l’utilisateur l’a ouverte
    seen: {
      type: Boolean,
      default: false,
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
  },
);

// on va souvent lister les notifs récentes d’un user
notificationSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "n_user_recent" },
);

module.exports = mongoose.model("Notification", notificationSchema);
