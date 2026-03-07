// backend/src/payments/handlers/fmmetrix.handler.js

const FmMetrix = require("../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../models/fmmetrixSubscription.model");
const User = require("../../../models/user.model");
const AffiliationCommission = require("../../../models/affiliationCommission.model");
const FmMetrixNotifier = require("../../../services/fmmetrixNotifier.service");

function normalizeProvider(payment) {
  const v = String(
    payment?.provider ||
      payment?.source ||
      payment?.gateway ||
      payment?.raw?.provider ||
      payment?.raw?.payment_gateway ||
      "",
  )
    .toLowerCase()
    .trim();

  if (!v) return "unknown";
  if (v.includes("nowpayments")) return "nowpayments";
  if (v.includes("stripe")) return "stripe";
  if (v.includes("feexpay")) return "feexpay";

  return v;
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return null;
}

function extractStableRef(payment) {
  const raw = payment?.raw || {};
  const meta = payment?.meta || {};

  const nowRef = pickFirst(
    raw.payment_id,
    raw.paymentId,
    raw.id,
    raw.invoice_id,
    raw.invoiceId,
    raw.transaction_id,
    raw.transactionId,
    raw.order_id,
  );

  const feexRef = pickFirst(
    raw?.reference,
    raw?.id,
    raw?.transaction_id,
    meta?.customId,
    meta?.orderId,
  );

  const stripeRef = pickFirst(
    raw.id,
    raw.session_id,
    raw.checkout_session_id,
    raw.subscription,
    raw.subscriptionId,
    raw.stripeSubscriptionId,
    raw.customer,
    raw.customerId,
  );

  const generic = pickFirst(
    meta.orderId,
    meta.orderRef,
    meta.planId,
    meta.productId,
    meta.courseId,
    meta.communityId,
    payment?.id,
    payment?.tx,
  );

  const provider = normalizeProvider(payment);

  if (provider === "nowpayments") return nowRef || generic;
  if (provider === "feexpay") return feexRef || generic;
  if (provider === "stripe") return stripeRef || generic;

  return nowRef || feexRef || stripeRef || generic;
}

async function handleFmMetrixPaymentEvent(payment) {
  try {
    const meta = payment?.meta || {};
    const userId = meta.userId || meta.user_id || null;

    // 🛑 GESTION DE L'ÉCHEC DU PAIEMENT (Prélèvement Automatique Refusé)
    if (payment?.status === "failed") {
      const raw = payment?.raw || {};
      const stripeSubscriptionId = raw.subscription; // id de l'abonnement stripe

      if (stripeSubscriptionId) {
        const sub = await FmMetrixSubscription.findOne({
          stripeSubscriptionId,
        }).lean();

        if (sub) {
          const uId = sub.userId;
          const now = new Date();

          // 1. Couper l'accès global
          await FmMetrix.updateOne(
            { userId: uId },
            { $set: { validUntil: now, "raw.status": "payment_failed" } },
          );

          // 2. Mettre l'abonnement spécifique en échec
          await FmMetrixSubscription.updateOne(
            { _id: sub._id },
            { $set: { status: "failed", periodEnd: now } },
          );

          // 3. Envoyer l'email d'interruption
          await FmMetrixNotifier.notifyCanceled({
            userId: String(uId),
            endedAt: now,
            reason:
              "Échec du prélèvement automatique sur votre carte bancaire. Veuillez mettre à jour votre moyen de paiement.",
            dedupeKey: `failed:${raw.id || stripeSubscriptionId}`,
          });

          console.log(
            `[FM-METRIX HANDLER] Abonnement Stripe suspendu pour échec de prélèvement (Sub: ${stripeSubscriptionId})`,
          );
        }
      }
      return; // On arrête ici pour un échec
    }

    if (!userId) {
      console.warn("[FM-METRIX HANDLER] userId manquant");
      return;
    }

    if (payment?.status !== "success") {
      console.log(
        "[FM-METRIX HANDLER] payment status is neither success nor failed → ignore",
      );
      return;
    }

    // ✅ GESTION DU SUCCÈS (Le code existant ne bouge pas)
    const provider = normalizeProvider(payment);
    const stableRef = extractStableRef(payment);

    if (!stableRef) {
      console.warn(
        "[FM-METRIX HANDLER] ref stable manquante → skip pour éviter duplications",
        { provider },
      );
      return;
    }

    const dedupeKey = `${provider}:${stableRef}`;

    const already = await FmMetrixSubscription.findOne({
      userId,
      "raw.fm_dedupe_key": dedupeKey,
    })
      .select("_id")
      .lean();

    if (already) {
      console.log("[FM-METRIX HANDLER] duplicate ignored:", dedupeKey);
      return;
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const raw =
      payment?.raw && typeof payment.raw === "object" ? payment.raw : {};
    const rawWithTags = {
      ...raw,
      fm_provider: provider,
      fm_ref: stableRef,
      fm_dedupe_key: dedupeKey,
    };

    await FmMetrix.findOneAndUpdate(
      { userId },
      {
        userId,
        startedAt: periodStart,
        validUntil: periodEnd,
        raw: rawWithTags,
      },
      { upsert: true },
    );

    const subDoc = await FmMetrixSubscription.create({
      userId,
      status: "active",
      periodStart,
      periodEnd,
      raw: rawWithTags,
    });

    // ✅ Commissions
    const existingCommission = await AffiliationCommission.findOne({
      userId,
      source: "fm-metrix",
      "raw.fm_dedupe_key": dedupeKey,
    })
      .select("_id")
      .lean()
      .catch(() => null);

    if (!existingCommission) {
      const user = await User.findById(userId)
        .select("_id referredBy")
        .lean()
        .catch(() => null);

      if (user && user.referredBy) {
        await AffiliationCommission.create({
          referrerId: user.referredBy,
          userId,
          amount: Math.round((payment?.amount || 0) * 0.15 * 100),
          currency: payment?.currency || "usd",
          source: "fm-metrix",
          raw: {
            ...(payment?.raw || {}),
            fm_dedupe_key: dedupeKey,
            fm_provider: provider,
            fm_ref: stableRef,
            subscriptionId: String(subDoc._id),
          },
        });
      }
    }
  } catch (err) {
    console.error("[FM-METRIX HANDLER] error:", err);
  }
}

module.exports = { handleFmMetrixPaymentEvent };
