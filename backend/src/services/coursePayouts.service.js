// backend/src/services/coursePayouts.service.js
const CourseOrder = require("../models/courseOrder.model");
const CoursePayout = require("../models/coursePayout.model");
const AdminCourseCommission = require("../models/adminCourseCommission.model");
const User = require("../models/user.model");

// ✅ Nouveaux imports pour les notifications
const { sendCourseSaleNotificationEmail } = require("../utils/mailer");
const { createNotif } = require("../utils/notifications");

const toUnits = (cents) => Math.round(Number(cents || 0)) / 100;

// ✅ Commission fixée à 0%
const COURSE_COMMISSION_PCT = 0;

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

  // ✅ Logique sans aucune commission
  const pct = 0;
  const unitAmountCents = Number(order.unitAmountCents || 0);
  const grossAmountCents = unitAmountCents;
  const commissionAmountCents = 0; // La plateforme ne prend plus rien
  const netAmountCents = grossAmountCents; // Le formateur prend 100%
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
    commissionAmount: 0,
    netAmount: netAmountUnit,
    status: "available",
  });

  // 2. Commission Admin (Enregistrée à 0$ pour les stats de ventes globales)
  await AdminCourseCommission.create({
    order: order._id,
    course,
    seller,
    buyer,
    currency,
    commissionRate: pct,
    commissionAmountCents: 0,
    commissionAmount: 0,
  });

  // 3. ✅ VERSEMENT : Crédit du solde communauté (100% de la vente)
  await User.findByIdAndUpdate(seller, {
    $inc: { communityBalance: netAmountUnit },
  });

  console.log(
    `[COURSE PAYOUT] +${netAmountUnit}$ (100% sans commission) ajoutés au formateur ${seller}`,
  );

  // 4. ✅ NOTIFICATIONS AU VENDEUR (Email + In-App)
  try {
    const sellerDoc = await User.findById(seller)
      .select("email profile")
      .lean();
    const buyerDoc = await User.findById(buyer)
      .select("email profile name")
      .lean();

    const sellerName =
      sellerDoc?.profile?.fullName || sellerDoc?.profile?.name || "";
    const buyerName =
      buyerDoc?.profile?.fullName ||
      buyerDoc?.profile?.name ||
      buyerDoc?.name ||
      buyerDoc?.email ||
      "Un client";
    const earningsStr = `${netAmountUnit} ${currency.toUpperCase()}`;
    const courseTitle = order.courseTitle || "Formation";

    // A. Notification In-App
    await createNotif({
      userId: seller,
      kind: "course_sale_made",
      payload: {
        buyerName,
        courseTitle,
        amount: earningsStr,
      },
    });

    // B. Envoi de l'Email
    if (sellerDoc?.email) {
      await sendCourseSaleNotificationEmail({
        to: sellerDoc.email,
        fullName: sellerName,
        buyerName,
        courseTitle,
        earnings: earningsStr,
      });
    }
  } catch (err) {
    console.error(
      "[COURSE PAYOUT] Erreur lors de l'envoi des notifications au vendeur:",
      err,
    );
  }
}

module.exports = { ensurePayoutsForCourseOrder };
