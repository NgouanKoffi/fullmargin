// backend/src/routes/payments/features/fmmetrix/fmmetrix.service.js
"use strict";

const FmMetrix = require("../../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../../models/fmmetrixSubscription.model");
const User = require("../../../../models/user.model");
const AffiliationCommission = require("../../../../models/affiliationCommission.model");

const FmMetrixNotifier = require("../../../../services/fmmetrixNotifier.service");

const {
  convertManualCryptoDocumentToEvent,
} = require("../../providers/crypto.provider");

const { initiateFeexPayTransaction } = require("../../feexpay.core");
const { dispatchPayment } = require("../../../payments/payment.dispatcher");

// --- STRIPE INIT ---
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
  } catch (e) {
    console.error("[Service] Stripe init error", e);
  }
}

// --- HELPERS ---
function resolveWebBase(origin) {
  const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();

  if (
    origin &&
    typeof origin === "string" &&
    origin.startsWith("https://") &&
    origin.includes("fullmargin.net")
  ) {
    return origin.replace(/\/+$/, "");
  }

  const fromStripe = process.env.STRIPE_PUBLIC_WEB_BASE_URL;
  if (fromStripe && fromStripe.trim()) return fromStripe.replace(/\/+$/, "");

  const fromPublic = process.env.PUBLIC_WEB_BASE_URL || process.env.APP_URL;
  if (fromPublic && fromPublic.trim()) {
    const cleaned = fromPublic.replace(/\/+$/, "");
    if (nodeEnv !== "production" || !cleaned.includes("localhost")) {
      return cleaned;
    }
  }

  return nodeEnv === "production"
    ? "https://fullmargin.net"
    : "http://localhost:5173";
}

function toDateSafe(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function addMonthsSafe(base, months) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
}

function computeExtendedPeriod(prevValidUntil, monthsToAdd = 1) {
  const now = new Date();
  const prev = toDateSafe(prevValidUntil);

  const baseStart = prev && prev > now ? prev : now;
  const periodStart = new Date(baseStart);
  const periodEnd = addMonthsSafe(periodStart, monthsToAdd);

  return { periodStart, periodEnd };
}

async function hasAnyHistory(userId) {
  if (!userId) return false;
  const exists = await FmMetrixSubscription.exists({ userId }).catch(
    () => null,
  );
  return !!exists;
}

async function hasHistoryExcluding(userId, excludeId) {
  if (!userId) return false;
  const q = { userId };
  if (excludeId) q._id = { $ne: excludeId };
  const exists = await FmMetrixSubscription.exists(q).catch(() => null);
  return !!exists;
}

// --- LOGIQUE AFFILIATION ---
async function maybeCreateAffiliationCommission({
  userId,
  subscriptionDoc,
  session,
}) {
  const user = await User.findById(userId)
    .select("_id referredBy")
    .lean()
    .catch(() => null);
  if (!user || !user.referredBy) return;

  const referrerId = user.referredBy;
  const count = await FmMetrixSubscription.countDocuments({ userId });

  let monthIndex = 0;
  let rate = 0;
  if (count === 1) {
    monthIndex = 1;
    rate = 0.15;
  } else if (count === 2) {
    monthIndex = 2;
    rate = 0.09;
  } else {
    return;
  }

  const amountInCents = session.amount_total || session.amount_subtotal || 0;
  if (!amountInCents) return;

  const commissionInCents = Math.round(amountInCents * rate);
  const currency =
    session.currency ||
    (session?.subscription?.plan?.currency ?? "usd") ||
    "usd";

  await AffiliationCommission.create({
    referrerId,
    userId,
    subscriptionId: subscriptionDoc._id,
    monthIndex,
    rate,
    amount: commissionInCents,
    currency,
    source: "fm-metrix",
    raw: { stripeSessionId: session.id },
  });
}

// --- STRIPE SYNC ---
async function upsertFmMetrixFromStripeSession(session) {
  const userId = session.metadata.userId;

  const existing = await FmMetrixSubscription.findOne({
    stripeSessionId: session.id,
  }).lean();

  if (existing) {
    const latest = await FmMetrixSubscription.findOne({ userId })
      .sort({ periodEnd: -1, createdAt: -1 })
      .lean()
      .catch(() => null);

    const trueEnd = latest?.periodEnd || existing.periodEnd;
    const trueStart = latest?.periodStart || existing.periodStart;

    await FmMetrix.findOneAndUpdate(
      { userId },
      {
        $set: { validUntil: trueEnd },
        $setOnInsert: {
          userId,
          startedAt: trueStart,
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
          raw: session,
        },
      },
      { upsert: true },
    );

    return {
      periodStart: existing.periodStart,
      periodEnd: existing.periodEnd,
      alreadyProcessed: true,
    };
  }

  const prev = await FmMetrix.findOne({ userId })
    .select("validUntil startedAt stripeCustomerId stripeSubscriptionId")
    .lean()
    .catch(() => null);

  const hadHistory = await hasAnyHistory(userId);
  const { periodStart, periodEnd } = computeExtendedPeriod(prev?.validUntil, 1);

  const subDoc = await FmMetrixSubscription.create({
    userId,
    status: "active",
    periodStart,
    periodEnd,
    stripeCustomerId: session.customer || null,
    stripeSubscriptionId: session.subscription || null,
    stripeSessionId: session.id,
    raw: session,
  });

  await maybeCreateAffiliationCommission({
    userId,
    subscriptionDoc: subDoc,
    session,
  });

  await FmMetrix.findOneAndUpdate(
    { userId },
    {
      userId,
      stripeCustomerId: session.customer || prev?.stripeCustomerId || null,
      stripeSubscriptionId:
        session.subscription || prev?.stripeSubscriptionId || null,
      startedAt: prev?.startedAt || new Date(),
      validUntil: periodEnd,
      raw: session,
    },
    { upsert: true },
  );

  await FmMetrixNotifier.notifyActivatedOrRenewed({
    userId,
    validUntil: periodEnd,
    dedupeKey: `stripe:${session.id}`,
    isRenewal: hadHistory,
  });

  return { periodStart, periodEnd, hadHistory };
}

// ✅ STRIPE CHECKOUT
async function createCheckoutSession({
  userId,
  amount,
  currency,
  label,
  origin,
  redirectBase,
}) {
  if (!stripe) throw new Error("Stripe non configuré");
  if (!amount || amount <= 0) throw new Error("Montant invalide");

  let webBase = resolveWebBase(origin);
  if (redirectBase && redirectBase.startsWith("https://")) {
    webBase = redirectBase.replace(/\/+$/, "");
  }

  const successUrl = `${webBase}/fm-metrix/result?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${webBase}/fm-metrix/result?status=cancel`;

  return await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: currency || "usd",
          product_data: { name: label || "FM Metrix Pro" },
          unit_amount: amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: String(userId), feature: "fm-metrix" },
  });
}

// ✅ FEEXPAY CHECKOUT
async function createFeexPaySession({ userId, redirectBase, origin }) {
  let webBase = resolveWebBase(origin);
  if (redirectBase && redirectBase.startsWith("https://")) {
    webBase = redirectBase.replace(/\/+$/, "");
  }

  const amountXOF = 19500;
  const callbackUrl = `${webBase}/fm-metrix/dashboard`;

  const result = await initiateFeexPayTransaction({
    amount: amountXOF,
    callbackUrl: callbackUrl,
    customData: {
      feature: "fm-metrix",
      userId: String(userId),
    },
  });

  if (!result.ok) {
    throw new Error(result.error || "Erreur init FeexPay");
  }

  return { url: result.url };
}

async function confirmSessionAndActivate(sessionId, userId) {
  if (!stripe) throw new Error("Stripe non configuré");
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (
    !session.metadata ||
    session.metadata.feature !== "fm-metrix" ||
    String(session.metadata.userId) !== String(userId)
  ) {
    throw new Error(
      "Session Stripe non reconnue ou ne correspond pas à l'utilisateur",
    );
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw new Error("Paiement non confirmé");
  }

  const { periodEnd } = await upsertFmMetrixFromStripeSession(session);
  return { periodEnd };
}

async function approveCryptoPayment(subscriptionId, adminId) {
  const sub = await FmMetrixSubscription.findById(subscriptionId);
  if (!sub) throw new Error("Introuvable");
  if (sub.status !== "pending_crypto")
    throw new Error(
      "Cet abonnement n'est pas en attente de validation crypto.",
    );

  const prev = await FmMetrix.findOne({ userId: sub.userId })
    .select("validUntil startedAt stripeCustomerId stripeSubscriptionId")
    .lean()
    .catch(() => null);

  const { periodStart, periodEnd } = computeExtendedPeriod(prev?.validUntil, 1);
  const now = new Date();

  sub.status = "active";
  sub.periodStart = periodStart;
  sub.periodEnd = periodEnd;
  sub.raw = { ...(sub.raw || {}), validatedBy: adminId, validatedAt: now };
  await sub.save();

  await FmMetrix.findOneAndUpdate(
    { userId: sub.userId },
    {
      userId: sub.userId,
      startedAt: prev?.startedAt || periodStart,
      validUntil: periodEnd,
      raw: { ...(sub.raw || {}), source: "manual_crypto_approved" },
    },
    { upsert: true },
  );

  const isRenewal = await hasAnyHistory(sub.userId);
  await FmMetrixNotifier.notifyActivatedOrRenewed({
    userId: sub.userId,
    validUntil: periodEnd,
    dedupeKey: `crypto_approved:${sub._id}`,
    isRenewal: isRenewal,
  });

  try {
    const event = await convertManualCryptoDocumentToEvent(sub, "succeeded");
    await dispatchPayment(event);
  } catch (err) {
    console.error(
      `[Service] Erreur lors du dispatch du paiement crypto ${sub._id}:`,
      err,
    );
  }

  return sub;
}

/**
 * ✅ Accès manuel / FeexPay Auto
 */
async function grantManualAccess({
  userId,
  months,
  periodStart,
  periodEnd,
  adminId,
  adminEmail,
}) {
  let start,
    end,
    m = 0;

  const prev = await FmMetrix.findOne({ userId })
    .select("validUntil startedAt stripeCustomerId stripeSubscriptionId raw")
    .lean()
    .catch(() => null);

  if (periodStart && periodEnd) {
    start = new Date(periodStart);
    end = new Date(periodEnd);
  } else {
    m = Number(months) || 1;
    const computed = computeExtendedPeriod(prev?.validUntil, m);
    start = computed.periodStart;
    end = computed.periodEnd;
  }

  if (!start || !end || end <= start) throw new Error("Période invalide");

  const now = new Date();
  const status = end > now ? "active" : "expired";

  const subDoc = await FmMetrixSubscription.create({
    userId,
    status,
    periodStart: start,
    periodEnd: end,
    stripeCustomerId: prev?.stripeCustomerId || "MANUAL_GRANT",
    stripeSubscriptionId: prev?.stripeSubscriptionId || null,
    raw: {
      ...(prev?.raw || {}),
      source: "manual_admin",
      adminId,
      months: m || null,
      overrideAt: now,
    },
  });

  const update = {
    userId,
    startedAt: prev?.startedAt || start,
    validUntil: end,
    raw: {
      ...(prev?.raw || {}),
      manualOverride: {
        by: adminId,
        at: now,
        months: m || null,
        start,
        end,
        subscriptionId: subDoc._id,
      },
    },
  };

  if (prev?.stripeCustomerId) update.stripeCustomerId = prev.stripeCustomerId;
  if (prev?.stripeSubscriptionId)
    update.stripeSubscriptionId = prev.stripeSubscriptionId;

  const doc = await FmMetrix.findOneAndUpdate({ userId }, update, {
    upsert: true,
    new: true,
  });

  // ✅ DISTINCTION EXACTE : FeexPay vs Admin Manuel
  if (adminId === "FEEXPAY_SDK_AUTO") {
    const isRenewal = await hasAnyHistory(userId);
    await FmMetrixNotifier.notifyActivatedOrRenewed({
      userId: String(userId),
      validUntil: end,
      dedupeKey: `feexpay_grant:${String(subDoc._id)}`,
      isRenewal: isRenewal,
    });
  } else {
    await FmMetrixNotifier.notifyManualGrant({
      userId: String(userId),
      validUntil: end,
      months: m || null,
      adminEmail: adminEmail || "Administrateur",
      dedupeKey: `manual_grant:${String(subDoc._id)}`,
    });
  }

  return { doc, subDoc };
}

async function revokeAccess(userId, opts = {}) {
  const now = new Date();

  const prev = await FmMetrix.findOne({ userId })
    .select("validUntil")
    .lean()
    .catch(() => null);

  const latestSub = await FmMetrixSubscription.findOne({ userId })
    .sort({ periodEnd: -1, createdAt: -1 })
    .select("_id")
    .lean()
    .catch(() => null);

  await FmMetrix.deleteOne({ userId });

  await FmMetrixSubscription.updateMany(
    { userId, periodEnd: { $gt: now } },
    { $set: { periodEnd: now, status: "canceled" } },
  );

  const reason = typeof opts?.reason === "string" ? opts.reason : "";
  const dedupeKey =
    (typeof opts?.dedupeKey === "string" && opts.dedupeKey) ||
    `revoke:${String(latestSub?._id || userId)}:${now.toISOString().slice(0, 10)}`;

  const hadSomething = !!prev?.validUntil || !!(await hasAnyHistory(userId));
  if (hadSomething) {
    await FmMetrixNotifier.notifyCanceled({
      userId: String(userId),
      endedAt: now,
      reason,
      dedupeKey,
    });
  }

  return { ok: true };
}

/**
 * ✅ Annuler le renouvellement automatique (Résiliation côté client)
 * Le client garde son accès jusqu'à la fin de la période `validUntil`.
 */
async function cancelAutoRenew(userId) {
  const doc = await FmMetrix.findOne({ userId });
  if (!doc) throw new Error("Aucun abonnement actif trouvé.");

  if (doc.stripeSubscriptionId && stripe) {
    try {
      await stripe.subscriptions.update(doc.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      console.log(
        `[Stripe] Annulation programmée pour l'abonnement ${doc.stripeSubscriptionId}`,
      );
    } catch (err) {
      console.error(
        "[Stripe] Erreur lors de l'annulation du renouvellement :",
        err,
      );
    }
  }

  const raw = doc.raw || {};
  raw.autoRenew = false;
  raw.canceledAt = new Date();

  await FmMetrix.updateOne({ userId }, { $set: { raw } });

  // ✅ Envoi de l'email de confirmation de résiliation au client
  await FmMetrixNotifier.notifyCanceled({
    userId: String(userId),
    endedAt: doc.validUntil, // Il reste valide jusqu'à cette date
    reason:
      "Vous avez annulé le renouvellement automatique de votre abonnement. Vous garderez l'accès Premium jusqu'à la fin de la période en cours.",
    dedupeKey: `cancel_renew:${doc._id}:${Date.now()}`,
  });

  return { ok: true, validUntil: doc.validUntil };
}

module.exports = {
  createCheckoutSession,
  createFeexPaySession,
  confirmSessionAndActivate,
  approveCryptoPayment,
  grantManualAccess,
  revokeAccess,
  upsertFmMetrixFromStripeSession,
  cancelAutoRenew,
};
