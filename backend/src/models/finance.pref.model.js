// backend/src/models/finance.pref.model.js
const mongoose = require("mongoose");

const FinancePrefSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    globalCurrency: {
      type: String,
      default: "XOF",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FinancePref", FinancePrefSchema);
