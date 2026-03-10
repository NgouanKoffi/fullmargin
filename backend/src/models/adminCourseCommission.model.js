const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AdminCourseCommissionSchema = new Schema(
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
    commissionRate: { type: Number, required: true, min: 0, max: 100 }, // 5
    commissionAmountCents: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

AdminCourseCommissionSchema.index(
  { order: 1, course: 1 },
  { unique: true, name: "uniq_course_commission" }
);

module.exports = model("AdminCourseCommission", AdminCourseCommissionSchema);
