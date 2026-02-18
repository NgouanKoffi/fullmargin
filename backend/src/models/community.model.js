// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\community.model.js
const mongoose = require("mongoose");

const COMMUNITY_CATEGORIES = [
  "trading_markets",
  "education_formations",
  "outils_ressources",
  "mindset_psychologie",
  "business_finances",
  "communautes_coaching",
];

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    nameLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 140,
    },

    description: { type: String, trim: true, maxlength: 5000 },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    category: {
      type: String,
      trim: true,
      lowercase: true,
      enum: COMMUNITY_CATEGORIES,
      required: true,
    },
    // on laisse categoryOther au cas où d’anciennes données l’utilisent,
    // mais côté UI on ne propose plus de catégorie "autre".
    categoryOther: { type: String, trim: true, maxlength: 140, default: "" },

    coverUrl: { type: String, default: "" },
    logoUrl: { type: String, default: "" },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    membersCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },

    // ✅ Autoriser les abonnés à publier
    allowSubscribersPosts: { type: Boolean, default: false },

    // ✅ Compteur global de likes de la communauté (mis à jour sur like/unlike des posts)
    likesCount: { type: Number, default: 0 },

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

// plus besoin de forcer categoryOther = "" en fonction de "autre"
communitySchema.pre("validate", function (next) {
  if (this.name) this.nameLower = String(this.name).trim().toLowerCase();
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();
  next();
});

/* Index */
communitySchema.index({ slug: 1 }, { unique: true, name: "c_slug" });
communitySchema.index(
  { nameLower: 1 },
  {
    unique: true,
    name: "c_name_lower_unique",
    partialFilterExpression: { deletedAt: null },
  }
);
communitySchema.index({ ownerId: 1 }, { name: "c_ownerId" });
communitySchema.index({ deletedAt: 1 }, { name: "c_deletedAt" });
communitySchema.index(
  { name: "text", description: "text" },
  { name: "c_search_text", weights: { name: 5, description: 1 } }
);

module.exports = mongoose.model("Community", communitySchema);
module.exports.COMMUNITY_CATEGORIES = COMMUNITY_CATEGORIES;
