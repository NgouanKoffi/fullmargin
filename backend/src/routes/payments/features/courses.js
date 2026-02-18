/**
 * ROUTES HTTP pour les paiements Cours :
 * - création d’une CourseOrder
 * - checkout Stripe ou Crypto (Manuel)
 * - refresh de paiement (Stripe uniquement, Crypto se fait via Admin)
 * - lecture des paiements utilisateur
 */

const express = require("express");
const router = express.Router({ mergeParams: true });
const Stripe = require("stripe");
const mongoose = require("mongoose");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ----------------------------------------------
// MODELS
// ----------------------------------------------
const Course = require("../../../models/course.model");
const CourseOrder = require("../../../models/courseOrder.model");
const CourseEnrollment = require("../../../models/courseEnrollment.model");

// ----------------------------------------------
// SERVICES
// ----------------------------------------------
const {
  ensurePayoutsForCourseOrder,
} = require("../../../services/coursePayouts.service");
const { verifyAuthHeader } = require("../../auth/_helpers");

// ✅ Import du service Crypto Manuel
const { createManualCryptoIntent } = require("../../payments/crypto.core");

// ----------------------------------------------
// CONSTANTES
// ----------------------------------------------
const PUBLIC_WEB =
  process.env.PUBLIC_WEB_BASE_URL ||
  process.env.APP_URL ||
  "http://localhost:5173";

const CURRENCY = (
  process.env.STRIPE_DEFAULT_CURRENCY ||
  process.env.CURRENCY ||
  "usd"
).toLowerCase();

const toCents = (usd) => Math.round(Number(usd || 0) * 100);
const centsToUnit = (n) => (typeof n === "number" ? Math.round(n) / 100 : 0);

// ----------------------------------------------
// AUTH
// ----------------------------------------------
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a?.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

// ----------------------------------------------
// LOGIQUE COMMUNE : créer une CourseOrder
// ----------------------------------------------
async function createCourseOrderForPayment({ userId, rawCourseId }) {
  let courseId;
  try {
    courseId = new mongoose.Types.ObjectId(rawCourseId);
  } catch {
    return {
      ok: false,
      statusCode: 400,
      error: "CourseId invalide",
    };
  }

  const course = await Course.findOne({
    _id: courseId,
    deletedAt: null,
    isActive: true,
  }).lean();

  if (!course) {
    return {
      ok: false,
      statusCode: 404,
      error: "Cours introuvable",
    };
  }

  const sellerId =
    course.ownerId || course.owner || course.userId || course.user;
  if (!sellerId) {
    return {
      ok: false,
      statusCode: 400,
      error: "missing_seller",
      message: "Le propriétaire du cours est manquant.",
    };
  }

  if (String(sellerId) === String(userId)) {
    return {
      ok: false,
      statusCode: 400,
      error: "own_course",
      message: "Vous ne pouvez pas acheter votre propre cours.",
    };
  }

  // ✅ empêcher un achat si déjà inscrit
  const already = await CourseEnrollment.exists({
    userId: userId,
    courseId: course._id,
  });
  if (already) {
    return {
      ok: false,
      statusCode: 400,
      error: "already_enrolled",
      message: "Vous êtes déjà inscrit à ce cours.",
    };
  }

  if (course.priceType !== "paid") {
    return {
      ok: false,
      statusCode: 400,
      error: "not_payable",
      message: "Ce cours n’est pas payable.",
    };
  }

  const unit = Number(course.price || 0);
  const unitCents = toCents(unit);
  if (!Number.isFinite(unit) || unitCents <= 0) {
    return {
      ok: false,
      statusCode: 400,
      error: "Montant invalide",
    };
  }

  const order = await CourseOrder.create({
    user: userId,
    course: course._id,
    courseTitle: course.title || "Cours",
    seller: sellerId,
    currency: (course.currency || CURRENCY).toLowerCase(),
    unitAmount: unit,
    unitAmountCents: unitCents,
    status: "requires_payment", // ✅ visible dans /mine immédiatement
  });

  return {
    ok: true,
    order,
    course,
  };
}

// ----------------------------------------------
// ENROLLMENT après paiement réussi
// ----------------------------------------------
async function ensureEnrollmentForSucceededOrder(order) {
  try {
    if (!order || order.status !== "succeeded") return;

    await CourseEnrollment.updateOne(
      { userId: order.user, courseId: order.course },
      { $setOnInsert: { userId: order.user, courseId: order.course } },
      { upsert: true },
    );
  } catch (e) {
    console.error("[COURSE ENROLL] ensure error:", e?.stack || e);
  }
}

// ----------------------------------------------
// HYDRATE ORDER (pour refresh, Stripe uniquement)
// ----------------------------------------------
async function hydrateCourseOrder({ order, session, pi }) {
  if (!pi) {
    const pid =
      (typeof session?.payment_intent === "string"
        ? session.payment_intent
        : session?.payment_intent?.id) || order?.stripe?.paymentIntentId;
    if (pid) {
      pi = await stripe.paymentIntents.retrieve(pid, {
        expand: [
          "latest_charge",
          "latest_charge.balance_transaction",
          "payment_method",
        ],
      });
    }
  }

  const customerEmail =
    session?.customer_details?.email ||
    session?.customer_email ||
    order?.stripe?.customerEmail ||
    null;

  const charge =
    typeof pi?.latest_charge === "object" ? pi.latest_charge : undefined;

  const pm = typeof pi?.payment_method === "object" ? pi.payment_method : null;
  const pmCard = pm?.card || {};
  const paymentMethod = pm
    ? {
        type: pm.type || null,
        brand: pmCard.brand || null,
        last4: pmCard.last4 || null,
        expMonth: pmCard.exp_month || null,
        expYear: pmCard.exp_year || null,
      }
    : order?.stripe?.paymentMethod || null;

  const bt =
    typeof charge?.balance_transaction === "object"
      ? charge.balance_transaction
      : null;

  const currency = (
    bt?.currency ||
    pi?.currency ||
    order.currency ||
    "usd"
  ).toLowerCase();

  const amountCents =
    typeof bt?.amount === "number"
      ? bt.amount
      : typeof pi?.amount_received === "number"
        ? pi.amount_received
        : order.unitAmountCents;

  const feeCents = typeof bt?.fee === "number" ? bt.fee : null;
  const netCents =
    typeof bt?.net === "number"
      ? bt.net
      : amountCents != null && feeCents != null
        ? amountCents - feeCents
        : null;

  const paidAtStripe =
    charge?.created != null ? new Date(charge.created * 1000) : null;

  order.stripe = {
    ...(order.stripe || {}),
    checkoutSessionId: session?.id || order?.stripe?.checkoutSessionId || "",
    paymentIntentId:
      (typeof session?.payment_intent === "string"
        ? session.payment_intent
        : session?.payment_intent?.id) ||
      pi?.id ||
      order?.stripe?.paymentIntentId ||
      "",
    chargeId:
      (typeof pi?.latest_charge === "string" ? pi.latest_charge : charge?.id) ||
      order?.stripe?.chargeId ||
      "",
    receiptUrl: charge?.receipt_url || order?.stripe?.receiptUrl || "",
    customerEmail: customerEmail || order?.stripe?.customerEmail || "",
    paymentMethod: paymentMethod || order?.stripe?.paymentMethod || undefined,
    amounts: {
      currency,
      amount:
        typeof amountCents === "number"
          ? centsToUnit(amountCents)
          : order?.unitAmount || null,
      amountCents: amountCents ?? order?.unitAmountCents ?? null,
      fee:
        typeof feeCents === "number"
          ? centsToUnit(feeCents)
          : order?.stripe?.amounts?.fee || null,
      feeCents: feeCents ?? order?.stripe?.amounts?.feeCents ?? null,
      net:
        typeof netCents === "number"
          ? centsToUnit(netCents)
          : order?.stripe?.amounts?.net || null,
      netCents: netCents ?? order?.stripe?.amounts?.netCents ?? null,
    },
  };

  if (pi?.status === "succeeded" || session?.payment_status === "paid") {
    order.status = "succeeded";
    order.paidAt = order.paidAt || paidAtStripe || new Date();
  } else if (session?.status === "expired" || pi?.status === "canceled") {
    order.status = "canceled";
  } else if (!["succeeded", "failed", "canceled"].includes(order.status)) {
    order.status = "requires_payment";
  }
}

// ----------------------------------------------
// ROUTE : CHECKOUT cours (Stripe / Crypto)
// ----------------------------------------------
router.post("/:id/checkout", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const method = String(req.body?.method || "stripe").toLowerCase();

    const base = await createCourseOrderForPayment({
      userId,
      rawCourseId: req.params.id,
    });

    if (!base.ok) {
      return res
        .status(base.statusCode || 400)
        .json({ ok: false, error: base.error, message: base.message });
    }

    const { order, course } = base;

    // --------------------------
    // ✅ MANUAL CRYPTO (WhatsApp)
    // --------------------------
    if (method === "crypto") {
      const orderId = String(order._id);

      // Génération de la REF pour WhatsApp
      const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // On met à jour l'order avec les infos crypto
      // On utilise le champ stripe.paymentIntentId pour stocker la REF
      order.status = "requires_payment"; // Reste en attente
      order.stripe = {
        ...(order.stripe || {}),
        paymentIntentId: reference,
        paymentMethod: {
          type: "manual_crypto",
          brand: req.body?.network || "USDT", // ex: BEP20
        },
        customerEmail: req.body?.customer_email || null,
      };

      await order.save();

      // On renvoie juste la REF au front pour qu'il ouvre WhatsApp
      res.set("Cache-Control", "no-store");
      return res.status(200).json({
        ok: true,
        data: {
          url: null, // Pas de redirect URL pour crypto manuel
          orderId,
          reference: reference, // La REF à envoyer sur WhatsApp
          manual: true, // Flag pour le front
        },
      });
    }

    // --------------------------
    // STRIPE Checkout (défaut)
    // --------------------------
    const successUrl =
      `${PUBLIC_WEB}/communaute/mon-espace?tab=achats` +
      `&paid=1` +
      `&order=${order._id}` +
      `&session_id={CHECKOUT_SESSION_ID}` +
      `&course=${course._id}`;

    const cancelUrl = `${PUBLIC_WEB}/communaute/courses/${course._id}?cancel=1&order=${order._id}`;

    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (course.currency || CURRENCY).toLowerCase(),
            product_data: { name: course.title || "Cours" },
            unit_amount: order.unitAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        feature: "course",
        courseOrderId: String(order._id),
        userId: String(userId),
        courseId: String(course._id),
      },
    });

    order.stripe = {
      ...(order.stripe || {}),
      checkoutSessionId: sessionStripe.id,
    };
    await order.save();

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, data: { url: sessionStripe.url } });
  } catch (e) {
    console.error("[COURSE PAYMENTS] checkout error:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Checkout impossible" });
  }
});

// ----------------------------------------------
// ROUTE : REFRESH paiement (Stripe uniquement)
// ----------------------------------------------
router.post("/refresh", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { orderId, sessionId, paymentIntentId } = req.body || {};

    let order =
      (orderId &&
        (await CourseOrder.findOne({ _id: String(orderId), user: userId }))) ||
      (sessionId &&
        (await CourseOrder.findOne({
          "stripe.checkoutSessionId": String(sessionId),
          user: userId,
        }))) ||
      (paymentIntentId &&
        (await CourseOrder.findOne({
          "stripe.paymentIntentId": String(paymentIntentId),
          user: userId,
        })));

    if (!order)
      return res.status(404).json({ ok: false, error: "Commande introuvable" });

    // Si c'est du crypto manuel, on ne refresh pas via Stripe
    if (order.stripe?.paymentMethod?.type === "manual_crypto") {
      return res.json({
        ok: true,
        data: {
          order: {
            id: String(order._id),
            status: order.status,
            // ... autres champs si besoin
          },
          enrolled: order.status === "succeeded",
        },
      });
    }

    let session = null,
      pi = null;

    const sid = String(sessionId || order?.stripe?.checkoutSessionId || "");
    if (sid) {
      try {
        session = await stripe.checkout.sessions.retrieve(sid, {
          expand: ["payment_intent", "customer_details"],
        });
      } catch {}
    }

    const pid = String(paymentIntentId || order?.stripe?.paymentIntentId || "");
    if (!pi && pid) {
      try {
        pi = await stripe.paymentIntents.retrieve(pid, {
          expand: [
            "latest_charge",
            "latest_charge.balance_transaction",
            "payment_method",
          ],
        });
      } catch {}
    }

    await hydrateCourseOrder({ order, session, pi });
    await order.save();

    if (order.status === "succeeded") {
      await ensurePayoutsForCourseOrder(order);
      await ensureEnrollmentForSucceededOrder(order);
    }

    res.set("Cache-Control", "no-store");
    return res.json({
      ok: true,
      data: {
        order: {
          id: String(order._id),
          status: order.status,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
          course: String(order.course),
          courseTitle: order.courseTitle || null,
          stripe: {
            checkoutSessionId: order.stripe?.checkoutSessionId || null,
            paymentIntentId: order.stripe?.paymentIntentId || null,
            chargeId: order.stripe?.chargeId || null,
            receiptUrl: order.stripe?.receiptUrl || null,
            amounts: order.stripe?.amounts || null,
            paymentMethod: order.stripe?.paymentMethod || null,
          },
        },
        enrolled: order.status === "succeeded",
      },
    });
  } catch (e) {
    console.error("[COURSE PAYMENTS] refresh error:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Refresh impossible" });
  }
});

// ----------------------------------------------
// ROUTE : Lister mes paiements
// ----------------------------------------------
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.min(
      50,
      Math.max(parseInt(String(req.query.limit || "20"), 10), 1),
    );
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      CourseOrder.find({ user: req.auth.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseOrder.countDocuments({ user: req.auth.userId }),
    ]);

    const courseIds = [
      ...new Set(rows.map((r) => String(r.course || "")).filter(Boolean)),
    ];

    let byCourse = new Map();
    if (courseIds.length) {
      const courses = await Course.find({ _id: { $in: courseIds } })
        .select({ title: 1, coverUrl: 1, communityId: 1 })
        .lean();
      byCourse = new Map(courses.map((c) => [String(c._id), c]));
    }

    const items = rows.map((o) => {
      const c = byCourse.get(String(o.course)) || null;
      const stripeAmounts = o.stripe?.amounts || {};

      return {
        id: String(o._id),
        status: o.status,
        paidAt: o.paidAt || null,
        createdAt: o.createdAt || null,
        course: c
          ? {
              id: String(o.course),
              title: c.title || o.courseTitle || "Cours",
              coverUrl: c.coverUrl || "",
              communityId: c.communityId ? String(c.communityId) : null,
            }
          : {
              id: String(o.course),
              title: o.courseTitle || "Cours",
              coverUrl: "",
              communityId: null,
            },
        amounts: {
          currency: (o.currency || CURRENCY).toLowerCase(),
          amount: Number.isFinite(o.unitAmount)
            ? o.unitAmount
            : stripeAmounts.amount || null,
          amountCents: o.unitAmountCents ?? stripeAmounts.amountCents ?? null,
          fee: stripeAmounts.fee ?? null,
          feeCents: stripeAmounts.feeCents ?? null,
          netAfterStripe: stripeAmounts.net ?? null,
          netAfterStripeCents: stripeAmounts.netCents ?? null,
        },
        receiptUrl: o.stripe?.receiptUrl || null,
        paymentMethod: o.stripe?.paymentMethod || null,
      };
    });

    res.set("Cache-Control", "no-store");
    return res.json({
      ok: true,
      data: {
        items,
        page,
        limit,
        total,
        hasMore: skip + rows.length < total,
      },
    });
  } catch (e) {
    console.error("[COURSE PAYMENTS] mine error:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

// ----------------------------------------------
// ROUTE : Lecture d’une order
// ----------------------------------------------
router.get("/:orderId", requireAuth, async (req, res) => {
  try {
    const row = await CourseOrder.findOne({
      _id: req.params.orderId,
      user: req.auth.userId,
    }).lean();

    if (!row) return res.status(404).json({ ok: false, error: "Introuvable" });

    res.set("Cache-Control", "no-store");
    return res.json({ ok: true, data: { ...row, id: String(row._id) } });
  } catch {
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
module.exports = {
  router,
  hydrateCourseOrder,
  ensureEnrollmentForSucceededOrder,
  createCourseOrderForPayment,
};
