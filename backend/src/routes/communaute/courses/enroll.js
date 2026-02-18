// backend/src/routes/communaute/courses/enroll.js
const {
  getAuth,
  isUserEnrolled,
  Course,
  CourseEnrollment,
} = require("./_shared");

// ➜ order + payout
const CourseOrder = require("../../../models/courseOrder.model");
const {
  ensurePayoutsForCourseOrder,
} = require("../../../services/coursePayouts.service");

// ➜ membership communauté
const CommunityMember = require("../../../models/communityMember.model");

const DEFAULT_CURRENCY = (
  process.env.CURRENCY ||
  process.env.STRIPE_DEFAULT_CURRENCY ||
  "usd"
).toLowerCase();

/**
 * Crée (ou met à jour) une "commande" + payout vendeur
 * pour une inscription à un cours GRATUIT.
 * ➜ Montants TOUJOURS à 0.
 */
async function ensureFreeOrderAndPayout({ course, userId }) {
  try {
    const sellerId =
      course.ownerId || course.owner || course.userId || course.user;

    // pas de seller ou auto-inscription → pas de "vente"
    if (!sellerId || String(sellerId) === String(userId)) return;

    const currency = (course.currency || DEFAULT_CURRENCY).toLowerCase();

    // ⚠️ IMPORTANT : pour les gratuits, on force TOUT à 0,
    // on ne se fie JAMAIS à course.price (qui peut contenir 20, 50, etc.)
    const unitAmount = 0;
    const unitAmountCents = 0;

    let order = await CourseOrder.findOneAndUpdate(
      { user: userId, course: course._id },
      {
        $set: {
          courseTitle: course.title || "Cours",
          seller: sellerId,
          currency,
          unitAmount,
          unitAmountCents,
          isFree: true, // petit flag utile pour debug
        },
        $setOnInsert: {
          status: "succeeded", // gratuit : on considère comme "payé"
          paidAt: new Date(),
          stripe: { kind: "free_enrollment" },
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (order.status !== "succeeded") {
      order.status = "succeeded";
      order.paidAt = order.paidAt || new Date();
      await order.save();
    }

    await ensurePayoutsForCourseOrder(String(order._id));
  } catch (e) {
    console.error(
      "[COURSE ENROLL] error while creating free order/payout:",
      e?.stack || e
    );
  }
}

module.exports = (router) => {
  router.post("/:id/enroll", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const course = await Course.findOne({
        _id: req.params.id,
        deletedAt: null,
        isActive: true,
      }).lean();

      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      // 🔴 AVANT toute inscription : vérifier l'abonnement à la communauté
      if (course.communityId) {
        const membership = await CommunityMember.findOne({
          communityId: course.communityId,
          userId: auth.userId,
          $or: [{ status: "active" }, { status: { $exists: false } }],
        }).lean();

        if (!membership) {
          return res.status(403).json({
            ok: false,
            error: "NOT_COMMUNITY_MEMBER",
            message:
              "Tu dois d’abord être abonné à la communauté pour t’inscrire à cette formation.",
          });
        }
      }

      // Les payants passent par Stripe
      if (course.priceType === "paid") {
        return res.status(400).json({
          ok: false,
          error: "COURSE_PAID",
          message: "Cette formation est payante. Utilisez le checkout.",
        });
      }

      const payload = { userId: auth.userId, courseId: course._id };
      await CourseEnrollment.updateOne(
        payload,
        { $setOnInsert: payload },
        { upsert: true }
      );

      const saved = await CourseEnrollment.findOne(payload).lean();

      // ➜ on crée la "vente" gratuite, mais avec montants = 0
      await ensureFreeOrderAndPayout({ course, userId: auth.userId });

      return res.json({ ok: true, data: { ...saved, id: String(saved._id) } });
    } catch (e) {
      if (e?.code === 11000) {
        const exists = await CourseEnrollment.findOne({
          userId: getAuth(req)?.userId,
          courseId: req.params.id,
        }).lean();
        return res.json({
          ok: true,
          data: { ...exists, id: String(exists._id) },
        });
      }
      console.error("[COURSES] enroll ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Inscription impossible" });
    }
  });

  router.get("/:id/enrollment", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const enrolled = await isUserEnrolled(auth.userId, req.params.id);
      res.set("Cache-Control", "no-store");
      return res.json({ ok: true, data: { enrolled } });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
