// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\mailSettings.model.js
const mongoose = require("mongoose");

const MailSettingsSchema = new mongoose.Schema(
  {
    // on garde un "key" pour en faire un singleton
    key: { type: String, default: "global", unique: true, index: true },

    fromName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },

    // HTML de signature
    signatureHtml: { type: String, default: "" },

    // image éventuellement insérée dans la signature (hébergée Cloudinary)
    signatureImageUrl: { type: String, default: "" },

    // optionnel: qui a modifié
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, collection: "mail_settings" }
);

module.exports =
  mongoose.models.MailSettings ||
  mongoose.model("MailSettings", MailSettingsSchema);
