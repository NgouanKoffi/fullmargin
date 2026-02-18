// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\communityAccessRequest.model.js
const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    // Optionnel: message laissé par l’utilisateur
    note: { type: String, trim: true, maxlength: 500, default: "" },
    // Optionnel: motif de refus
    reason: { type: String, trim: true, maxlength: 500, default: "" },
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

// Un utilisateur ne peut avoir qu'une demande active (quelque soit l'état) par communauté
accessRequestSchema.index(
  { communityId: 1, userId: 1 },
  { unique: true, name: "car_unique" }
);

module.exports = mongoose.model("CommunityAccessRequest", accessRequestSchema);
