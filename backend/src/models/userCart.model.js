// backend/src/models/userCart.model.js
const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const UserCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // ❌ pas de unique/index inline
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ un seul endroit
UserCartSchema.index({ user: 1 }, { unique: true, name: "uc_user_unique" });

module.exports = mongoose.model("UserCart", UserCartSchema);
