// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\service.model.js
const { Schema, model } = require("mongoose");

const ServiceSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 120,
    },
    /** Email expéditeur Brevo utilisé par le service */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      maxlength: 160,
    },
    /** Rôle/fonction courte: "podcasts", "notifications", "analytics", etc. */
    role: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    /** Description libre */
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    /** Actif/inactif si tu veux désactiver le service côté produit */
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    /** Optionnel: statut santé si tu veux l’exposer plus tard */
    status: {
      type: String,
      enum: ["ok", "error", "idle"],
      default: "idle",
    },
    lastCheckAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/** 🔒 Un email expéditeur ne peut pas être utilisé par 2 services */
ServiceSchema.index({ email: 1 }, { unique: true, name: "svc_email_unique" });

module.exports = model("Service", ServiceSchema);
