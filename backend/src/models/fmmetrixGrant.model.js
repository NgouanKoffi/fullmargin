// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\fmmetrixGrant.model.js
const mongoose = require("mongoose");

const FmMetrixGrantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // accès manuel (ex: ajouté par admin)
    validUntil: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FmMetrixGrant", FmMetrixGrantSchema);
