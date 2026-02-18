// backend/src/models/serviceMembership.model.js
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    since: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

module.exports = mongoose.model("ServiceMembership", membershipSchema);