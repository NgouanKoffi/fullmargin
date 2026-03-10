// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\mailboxState.model.js
const mongoose = require("mongoose");

const MailboxStateSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true }, // ex: "noreply"
    box: { type: String, required: true, index: true }, // ex: "INBOX" / "Spam"
    uidValidity: { type: Number, default: 0 }, // reset si change
    lastUid: { type: Number, default: 0 }, // dernier UID sync
    lastSync: { type: Date, default: null },
  },
  { timestamps: true }
);

MailboxStateSchema.index({ accountId: 1, box: 1 }, { unique: true });
MailboxStateSchema.index({ updatedAt: -1 });

module.exports =
  mongoose.models.MailboxState ||
  mongoose.model("MailboxState", MailboxStateSchema);
