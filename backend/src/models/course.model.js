// backend/src/models/course.model.js
const mongoose = require("mongoose");

/* ---------- CURRICULUM SCHEMAS ---------- */

const curriculumItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // uid front

    // ✅ on autorise image
    type: { type: String, enum: ["video", "pdf", "image"], required: true },

    // ✅ on stocke aussi un subtype pour l'UI (doc, image, link, etc.)
    subtype: { type: String, default: "" },

    title: { type: String, required: true, trim: true, maxlength: 180 },

    // RESSOURCE PERSISTÉE
    url: { type: String, default: "" }, // URL Cloudinary
    publicId: { type: String, default: "" }, // public_id Cloudinary
    durationMin: { type: Number, default: undefined }, // vidéos (nullable)
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // uid front
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "", trim: true, maxlength: 8000 },
    items: { type: [curriculumItemSchema], default: [] },
  },
  { _id: false }
);

const moduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // uid front
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "", trim: true, maxlength: 10000 },
    order: { type: Number, default: 0 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: false }
);

/* ----------------- COURSE ---------------- */

const courseSchema = new mongoose.Schema(
  {
    // Métadonnées de base
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 180,
    },
    titleLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 200,
    },

    // Rattachements
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Contenus
    introduction: { type: String, default: "", trim: true, maxlength: 10000 },
    shortDesc: { type: String, default: "", trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 30000 },
    coverUrl: { type: String, default: "" },

    // Programme
    modules: { type: [moduleSchema], default: [] },

    // Tarifs & méta
    level: { type: String, default: "Tous niveaux" },
    learnings: { type: [String], default: [] },
    priceType: { type: String, enum: ["free", "paid"], default: "free" },
    currency: { type: String, default: "USD" },
    price: { type: Number, default: undefined },

    // Avis
    reviewsCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: null },

    // État
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public", // anciens cours = public ; les nouveaux on forcera "private" si tu veux
      index: true,
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

courseSchema.pre("validate", function (next) {
  if (this.title) this.titleLower = String(this.title).trim().toLowerCase();
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();
  next();
});

/* Index */
courseSchema.index(
  { slug: 1, communityId: 1 },
  {
    unique: true,
    name: "course_slug_per_community",
    partialFilterExpression: { deletedAt: null },
  }
);
courseSchema.index(
  { titleLower: 1, communityId: 1 },
  {
    unique: true,
    name: "course_title_per_community",
    partialFilterExpression: { deletedAt: null },
  }
);
courseSchema.index({ deletedAt: 1 }, { name: "course_deletedAt" });

module.exports = mongoose.model("Course", courseSchema);
