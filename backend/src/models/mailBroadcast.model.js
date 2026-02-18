// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\mailBroadcast.model.js
const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    size: Number,
    path: String, // chemin local (ou clé S3)
  },
  { _id: false }
);

const MailBroadcastSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    from: { name: String, email: String },

    groupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "DiffusionGroup" }],
    toEmails: [String], // emails libres

    subject: String,
    bodyHtml: String,
    attachments: [AttachmentSchema],

    sendAt: Date, // null/absent = immédiat
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "done", "failed"],
      default: "draft",
    },

    stats: {
      requested: Number,
      sent: Number,
      failed: Number,
      lastError: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MailBroadcast", MailBroadcastSchema);
