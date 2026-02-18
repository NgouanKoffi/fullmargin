// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\mailMessage.model.js
const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    size: Number,
    url: String, // si tu stockes ailleurs
    path: String, // si tu gardes sur disque
  },
  { _id: false }
);

const MailMessageSchema = new mongoose.Schema(
  {
    folder: {
      type: String,
      enum: ["inbox", "sent", "trash"],
      required: true,
      index: true,
    },

    fromName: String,
    fromEmail: { type: String, index: true },

    // destinataires normalisés
    toEmails: [{ type: String, index: true }],

    subject: String,
    snippet: String,
    bodyHtml: String,
    bodyText: String,
    date: { type: Date, default: Date.now, index: true },
    unread: { type: Boolean, default: true },
    starred: { type: Boolean, default: false },

    // threading / provenance
    threadKey: { type: String, index: true },
    inReplyTo: String,
    messageId: { type: String, index: true },
    provider: { type: String, default: "brevo" },

    // lien vers la campagne (pour éviter les doublons)
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MailBroadcast",
      index: true,
      sparse: true,
    },

    attachments: [AttachmentSchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MailMessage ||
  mongoose.model("MailMessage", MailMessageSchema);
