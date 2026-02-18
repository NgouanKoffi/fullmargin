// backend/src/services/coursePayouts.service.js
const CourseOrder = require("../models/courseOrder.model");
const CoursePayout = require("../models/coursePayout.model");
const AdminCourseCommission = require("../models/adminCourseCommission.model");
const User = require("../models/user.model"); // ✅ Ajout

const toUnits = (cents) => Math.round(Number(cents || 0)) / 100;

const COURSE_COMMISSION_PCT = Number(process.env.COURSE_COMMISSION_PCT ?? 5);

async function ensurePayoutsForCourseOrder(orderOrId) {
  const order =
    typeof orderOrId === "string"
      ? await CourseOrder.findById(orderOrId).lean()
      : orderOrId?.toObject?.() || orderOrId;

  if (!order || order.status !== "succeeded") return;

  const currency = String(order.currency || "usd").toLowerCase();
  const buyer = order.user;
  const seller = order.seller;
  const course = order.course;

  // Vérifie si déjà traité
  const existing = await CoursePayout.findOne({
    order: order._id,
    course,
    seller,
  });
  if (existing) return; // ✅ Déjà traité

  const pct = Math.max(0, Number(COURSE_COMMISSION_PCT));
  const unitAmountCents = Number(order.unitAmountCents || 0);
  const grossAmountCents = unitAmountCents;
  const commissionAmountCents = Math.round((grossAmountCents * pct) / 100);
  const netAmountCents = grossAmountCents - commissionAmountCents;
  const netAmountUnit = toUnits(netAmountCents);

  // 1. Historique Payout
  await CoursePayout.create({
    order: order._id,
    course,
    seller,
    buyer,
    currency,
    commissionRate: pct,
    unitAmountCents,
    grossAmountCents,
    commissionAmountCents,
    netAmountCents,
    unitAmount: toUnits(unitAmountCents),
    grossAmount: toUnits(grossAmountCents),
    commissionAmount: toUnits(commissionAmountCents),
    netAmount: netAmountUnit,
    status: "available",
  });

  // 2. Commission Admin
  await AdminCourseCommission.create({
    order: order._id,
    course,
    seller,
    buyer,
    currency,
    commissionRate: pct,
    commissionAmountCents,
    commissionAmount: toUnits(commissionAmountCents),
  });

  // 3. ✅ VERSEMENT : Crédit du solde communauté
  await User.findByIdAndUpdate(seller, {
    $inc: { communityBalance: netAmountUnit },
  });

  console.log(
    `[COURSE PAYOUT] +${netAmountUnit}$ ajoutés au formateur ${seller}`,
  );
}

module.exports = { ensurePayoutsForCourseOrder };
