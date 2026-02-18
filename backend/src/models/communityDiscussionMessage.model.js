// backend/src/models/communityDiscussionMessage.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sous-schema pour une pièce jointe
const ChatAttachmentSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["image", "video", "pdf", "file"],
      default: "file",
    },
    url: { type: String, required: true },
    name: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    publicId: { type: String },
  },
  { _id: false }
);

const CommunityDiscussionMessageSchema = new Schema(
  {
    // ex: "priv_<communityId>_<memberId>" ou "group_<groupId>"
    threadKey: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true,
    },

    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    body: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ nouveau champ pour les fichiers
    attachments: {
      type: [ChatAttachmentSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

module.exports =
  mongoose.models.CommunityDiscussionMessage ||
  mongoose.model(
    "CommunityDiscussionMessage",
    CommunityDiscussionMessageSchema
  );
