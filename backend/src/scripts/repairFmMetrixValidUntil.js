"use strict";

require("dotenv").config();
const mongoose = require("mongoose");

const FmMetrix = require("../src/models/fmmetrix.model");
const FmMetrixSubscription = require("../src/models/fmmetrixSubscription.model");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("DB connected");

  const docs = await FmMetrix.find().select("_id userId validUntil").lean();
  let fixed = 0;

  for (const d of docs) {
    const latest = await FmMetrixSubscription.findOne({ userId: d.userId })
      .sort({ periodEnd: -1, createdAt: -1 })
      .lean()
      .catch(() => null);

    if (!latest?.periodEnd) continue;

    const trueEnd = new Date(latest.periodEnd);
    const currEnd = d.validUntil ? new Date(d.validUntil) : null;

    if (!currEnd || currEnd.getTime() !== trueEnd.getTime()) {
      await FmMetrix.updateOne(
        { _id: d._id },
        { $set: { validUntil: trueEnd } },
      );
      fixed++;
    }
  }

  console.log("Fixed:", fixed);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
