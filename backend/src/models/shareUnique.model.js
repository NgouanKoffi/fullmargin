const mongoose = require("mongoose");

const ShareUniqueSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, index: true },
    viewer: { type: String, required: true }, // id persistant navigateur (ou fallback ip+ua)
    firstSeenAt: { type: Date, default: Date.now },
  },
  { collection: "share_uniques" }
);

// une seule ligne par (hash, viewer)
ShareUniqueSchema.index({ hash: 1, viewer: 1 }, { unique: true });

module.exports =
  mongoose.models.ShareUnique || mongoose.model("ShareUnique", ShareUniqueSchema);