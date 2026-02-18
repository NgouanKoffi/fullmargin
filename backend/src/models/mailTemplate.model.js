// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\mailTemplate.model.js
const mongoose = require("mongoose");

const MailTemplateSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    subject:     { type: String, default: "", trim: true },
    html:        { type: String, default: "" },
    slug:        { type: String, default: "", trim: true, index: true, unique: false },
    // futur: versioning, owner, etc.
  },
  { timestamps: true, collection: "mail_templates" }
);

module.exports =
  mongoose.models.MailTemplate || mongoose.model("MailTemplate", MailTemplateSchema);
