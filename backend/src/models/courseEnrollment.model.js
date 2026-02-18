// backend/src/models/courseEnrollment.model.js
const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
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

/* 1 inscription unique par user/course */
courseEnrollmentSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true, name: "enroll_user_course_unique" }
);

module.exports = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
