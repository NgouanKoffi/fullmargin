// backend/src/payments/handlers/course.handler.js

const CourseOrder = require("../../../models/courseOrder.model"); // ✅ chemins corrigés
const CourseEnrollment = require("../../../models/courseEnrollment.model");
const {
  ensurePayoutsForCourseOrder,
} = require("../../../services/coursePayouts.service");

function normalizeStatus(s) {
  const v = String(s || "")
    .toLowerCase()
    .trim();
  if (v === "succeeded") return "success";
  if (v === "cancelled") return "canceled";
  return v;
}

function extractOrderId(payment) {
  const meta = payment?.meta || {};
  return (
    meta.courseOrderId ||
    meta.orderId ||
    meta.order ||
    meta.order_id ||
    meta.ref ||
    payment?.orderId ||
    payment?.order_id ||
    payment?.ref ||
    null
  );
}

async function handleCoursePaymentEvent(payment) {
  try {
    const orderId = extractOrderId(payment);

    if (!orderId) {
      console.warn("[COURSE HANDLER] orderId introuvable");
      return;
    }

    const order = await CourseOrder.findById(orderId);
    if (!order) {
      console.warn("[COURSE HANDLER] Order non trouvée:", orderId);
      return;
    }

    const status = normalizeStatus(payment?.status);

    switch (status) {
      case "success": {
        // ✅ idempotent : ne pas écraser paidAt si déjà présent
        if (order.status !== "succeeded") {
          order.status = "succeeded";
          order.paidAt = order.paidAt || new Date();
          await order.save();
        }

        // Enrollment automatique
        await CourseEnrollment.updateOne(
          { userId: order.user, courseId: order.course },
          { $setOnInsert: { userId: order.user, courseId: order.course } },
          { upsert: true },
        );

        // Paiements seller
        await ensurePayoutsForCourseOrder(order);

        break;
      }

      case "failed":
      case "canceled": {
        // ✅ si déjà succeeded, on ne rétrograde pas (évite incohérences)
        if (order.status !== "succeeded") {
          order.status = status;
          await order.save();
        }
        break;
      }

      default:
        // pending / waiting / confirming / etc.
        // (on peut log si tu veux)
        break;
    }
  } catch (err) {
    console.error("[COURSE HANDLER] error:", err);
  }
}

module.exports = { handleCoursePaymentEvent };
