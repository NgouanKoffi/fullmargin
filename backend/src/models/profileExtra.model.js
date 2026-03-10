// backend/src/models/profileExtra.model.js
const mongoose = require("mongoose");

/**
 * Données complémentaires de profil.
 * 👉 La couverture n’est PLUS stockée ici (migrée vers User.coverUrl).
 *    Garder ce schéma allégé évite toute divergence avec User.
 */
const ProfileExtraSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // (Facultatif) doublon UI — la valeur canonique du nom reste sur User.fullName
    fullName: { type: String, trim: true, maxlength: 120, default: "" },

    // Coordonnées & bio
    phone:   { type: String, trim: true, default: "" }, // stocké en E.164 côté routes
    country: { type: String, trim: true, uppercase: true, minlength: 2, maxlength: 2, default: "" },
    city:    { type: String, trim: true, maxlength: 120, default: "" },
    bio:     { type: String, trim: true, maxlength: 1000, default: "" },

    // ❌ coverUrl: supprimé — utiliser User.coverUrl
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("ProfileExtra", ProfileExtraSchema);