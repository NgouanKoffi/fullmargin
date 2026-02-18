// backend/src/payments/handlers/fmmetrix.handler.js

const FmMetrix = require("../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../models/fmmetrixSubscription.model");
const User = require("../../../models/user.model");
const AffiliationCommission = require("../../../models/affiliationCommission.model");

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
  if (v.includes("fedapay")) return "fedapay";
  return v;
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return null;
}

/**
 * On extrait une référence "stable" pour dédoublonner.
 * NOWPayments: payment_id / id / invoice_id
 * FedaPay: transaction.id / transaction.reference
 * Stripe: id (session) / subscription / customer
 * Fallback: order_id / meta.orderId / meta.orderRef / tx
 */
function extractStableRef(payment) {
  const raw = payment?.raw || {};
  const meta = payment?.meta || {};

  // NOWPayments
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

  // FedaPay
  const fedaRef = pickFirst(
    raw?.transaction?.id,
    raw?.transaction?.reference,
    raw?.transaction?.ref,
    raw?.transaction_id,
  );

  // Stripe & Manual Crypto
  const stripeRef = pickFirst(
    raw.id,
    raw.session_id,
    raw.checkout_session_id,
    raw.subscription,
    raw.subscriptionId,
    // ✅ CORRECTION ICI : On ajoute le champ utilisé par le Crypto Manuel
    raw.stripeSubscriptionId,
    raw.customer,
    raw.customerId,
  );

  // Generic fallbacks
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
  if (provider === "fedapay") return fedaRef || generic;
  if (provider === "stripe") return stripeRef || generic;

  return nowRef || fedaRef || stripeRef || generic;
}

async function handleFmMetrixPaymentEvent(payment) {
  try {
    const meta = payment?.meta || {};
    const userId = meta.userId || meta.user_id || null;

    if (!userId) {
      console.warn("[FM-METRIX HANDLER] userId manquant");
      return;
    }

    // Le handler vérifie "success" ici (d'où l'importance de la modif dans le provider)
    if (payment?.status !== "success") {
      console.log("[FM-METRIX HANDLER] payment not success → ignore");
      return;
    }

    const provider = normalizeProvider(payment);
    const stableRef = extractStableRef(payment);

    // ✅ clé idempotente basée sur provider + ref (si ref manquante, on refuse d'insérer pour éviter les duplications)
    if (!stableRef) {
      console.warn(
        "[FM-METRIX HANDLER] ref stable manquante → skip pour éviter duplications",
        { provider },
      );
      return;
    }

    const dedupeKey = `${provider}:${stableRef}`;

    // ✅ déjà traité ? => stop
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

    // On enrichit raw pour l’historique + dédoublonnage
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

    // ✅ commissions (ne pas dupliquer)
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
