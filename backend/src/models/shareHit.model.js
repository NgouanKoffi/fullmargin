const mongoose = require("mongoose");

// Hit éphémère pour dédoublonner (TTL 5min)
const ShareHitSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, index: true },
    fp: { type: String, required: true },     // fingerprint ip+ua
    bucket: { type: Number, required: true }, // fenêtre de 5s
    createdAt: { type: Date, default: Date.now, expires: 300 }, // TTL 5 min
  },
  { collection: "share_hits" }
);

// Unicité: même hash+fp dans la même fenêtre → 1 vue max
ShareHitSchema.index({ hash: 1, fp: 1, bucket: 1 }, { unique: true });

module.exports = mongoose.models.ShareHit || mongoose.model("ShareHit", ShareHitSchema);