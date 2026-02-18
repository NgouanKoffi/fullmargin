const mongoose = require("mongoose");

const NoteShareSchema = new mongoose.Schema(
  {
    // Identifie logiquement un contenu partagé (payload/blob identique => même hash)
    hash: { type: String, required: true, unique: true, index: true },

    // Titre (display)
    title: { type: String, default: "" },

    // 🔑 Le contenu compressé (lz-string, encodé pour URI) stocké côté serveur
    // On laisse vide si on n'a pas stocké le blob (legacy "view" only).
    blob: { type: String, default: "" },

    // Compteur de vues UNIQUES (via /shares/view)
    uniqueViews: { type: Number, default: 0 },

    lastViewedAt: { type: Date, default: null },
  },
  {
    collection: "note_shares",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// compat: si anciens docs n'ont pas uniqueViews mais ont views
NoteShareSchema.virtual("viewsCompat").get(function () {
  return typeof this.uniqueViews === "number"
    ? this.uniqueViews
    : this.views || 0;
});

module.exports =
  mongoose.models.NoteShare || mongoose.model("NoteShare", NoteShareSchema);
