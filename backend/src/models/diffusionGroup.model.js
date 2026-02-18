// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\diffusionGroup.model.js
const mongoose = require("mongoose");

const EmailArraySetter = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((e) =>
      String(e || "")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);

const SegmentsSchema = new mongoose.Schema(
  {
    everyone: { type: Boolean, default: false },
    agents: { type: Boolean, default: false },
    communityOwners: { type: Boolean, default: false }, // optionnel / pour plus tard
    shopOwners: { type: Boolean, default: false }, // optionnel / pour plus tard
    custom: { type: Boolean, default: false },
    customEmails: {
      type: [String],
      default: [],
      set: EmailArraySetter,
    },
  },
  { _id: false }
);

const DiffusionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    description: { type: String, default: "" },
    segments: { type: SegmentsSchema, default: () => ({}) },

    // Snapshot optionnel des emails, pour “geler” un envoi (fiabiliser)
    snapshotEmails: {
      type: [String],
      default: [],
      set: EmailArraySetter,
    },
    recipientCount: { type: Number, default: 0 }, // compteur utile d’union actuelle

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

DiffusionGroupSchema.index({ createdBy: 1, name: 1 }); // recherche par admin + nom
DiffusionGroupSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("DiffusionGroup", DiffusionGroupSchema);
