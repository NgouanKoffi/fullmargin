// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\product.model.js
const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["one_time", "subscription"], required: true },
    amount: { type: Number, min: 0, required: true },
    interval: { type: String, enum: ["month", "year"], default: undefined },
  },
  { _id: false }
);

/* ------- Avis ------- */
const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "", maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
      required: true,
    },

    title: { type: String, required: true, maxlength: 120, index: "text" },
    shortDescription: { type: String, required: true, maxlength: 12000 },
    longDescription: { type: String, required: true, maxlength: 60000 },
    category: { type: String, default: "" },

    type: {
      type: String,
      enum: [
        "robot_trading",
        "indicator",
        "mt4_mt5",
        "ebook_pdf",
        "template_excel",
      ],
      required: true,
      index: true,
    },

    imageUrl: { type: String, default: "" },

    image: {
      src: { type: String, default: "" },
      srcset: { type: Object, default: {} }, // { "320": "...", "640": "...", ... }
      w: { type: Number, default: null },
      h: { type: Number, default: null },
      format: { type: String, default: "" },
    },

    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileMime: { type: String, default: "" },

    /** 🖼️ Galerie d’images supplémentaire (carrousel) */
    gallery: { type: [String], default: [] },

    /** 🎥 Liens de vidéos associées (YouTube, player, etc.) */
    videoUrls: { type: [String], default: [] },

    pricing: { type: PricingSchema, required: true },

    termsAccepted: { type: Boolean, required: true },

    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "suspended"],
      default: "draft",
      index: true,
    },
    moderation: {
      required: { type: Boolean, default: false },
      reviewedAt: { type: Date, default: null },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reason: { type: String, default: "" },
    },

    badgeEligible: { type: Boolean, default: false },

    /** ✅ NEW: mise en avant */
    featured: { type: Boolean, default: false, index: true },

    reviews: { type: [ReviewSchema], default: [] },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

ProductSchema.methods.recomputeRatings = function recomputeRatings() {
  const count = this.reviews.length;
  const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  this.ratingCount = count;
  this.ratingAvg = count ? Math.round((sum / count) * 10) / 10 : 0;
};

module.exports = mongoose.model("Product", ProductSchema);
