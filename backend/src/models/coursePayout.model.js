// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\coursePayout.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CoursePayoutSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "CourseOrder",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    currency: { type: String, default: "usd" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 }, // ex: 5
    unitAmountCents: { type: Number, required: true, min: 0 },
    grossAmountCents: { type: Number, required: true, min: 0 },
    commissionAmountCents: { type: Number, required: true, min: 0 },
    netAmountCents: { type: Number, required: true, min: 0 },

    unitAmount: { type: Number, required: true },
    grossAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["available", "paid"],
      default: "available",
      index: true,
    },
  },
  { timestamps: true }
);

CoursePayoutSchema.index(
  { order: 1, course: 1, seller: 1 },
  { unique: true, name: "uniq_course_line" }
);

module.exports = model("CoursePayout", CoursePayoutSchema);
