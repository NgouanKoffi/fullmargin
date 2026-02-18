// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\fmmetrix\fmmetrix.service.js
"use strict";

const FmMetrix = require("../../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../../models/fmmetrixSubscription.model");
const User = require("../../../../models/user.model");
const AffiliationCommission = require("../../../../models/affiliationCommission.model");

const FmMetrixNotifier = require("../../../../services/fmmetrixNotifier.service");

const {
  convertManualCryptoDocumentToEvent,
} = require("../../providers/crypto.provider");

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

/**
 * Extension de période :
 * - si actif => on prolonge depuis validUntil
 * - sinon => depuis now
 */
function computeExtendedPeriod(prevValidUntil, monthsToAdd = 1) {
  const now = new Date();
  const prev = toDateSafe(prevValidUntil);

  const baseStart = prev && prev > now ? prev : now;
  const periodStart = new Date(baseStart);
  const periodEnd = addMonthsSafe(periodStart, monthsToAdd);

  return { periodStart, periodEnd };
}

/** Renewal = il existe déjà un historique */
async function hasAnyHistory(userId) {
  if (!userId) return false;
  const exists = await FmMetrixSubscription.exists({ userId }).catch(
    () => null,
  );
  return !!exists;
}

/** Crypto approve : exclude doc actuel */
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

  // 1) Idempotence
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

  // 2) Etat précédent
  const prev = await FmMetrix.findOne({ userId })
    .select("validUntil startedAt stripeCustomerId stripeSubscriptionId")
    .lean()
    .catch(() => null);

  // ✅ renewal = historique
  const hadHistory = await hasAnyHistory(userId);

  const { periodStart, periodEnd } = computeExtendedPeriod(prev?.validUntil, 1);

  // 3) Save history
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

  // 4) Sync doc courant
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

  // 5) Email + notif
  await FmMetrixNotifier.notifyActivatedOrRenewed({
    userId,
    validUntil: periodEnd,
    dedupeKey: `stripe:${session.id}`,
    isRenewal: hadHistory,
  });

  return { periodStart, periodEnd, hadHistory };
}

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
  // 1. Récupération et vérification
  const sub = await FmMetrixSubscription.findById(subscriptionId);
  if (!sub) throw new Error("Introuvable");
  if (sub.status !== "pending_crypto")
    throw new Error(
      "Cet abonnement n'est pas en attente de validation crypto.",
    );

  // 2. Calcul des dates (avec historique)
  const prev = await FmMetrix.findOne({ userId: sub.userId })
    .select("validUntil startedAt stripeCustomerId stripeSubscriptionId")
    .lean()
    .catch(() => null);

  const { periodStart, periodEnd } = computeExtendedPeriod(prev?.validUntil, 1);
  const now = new Date();

  // 3. Mise à jour de l'abonnement
  sub.status = "active";
  sub.periodStart = periodStart;
  sub.periodEnd = periodEnd;
  sub.raw = { ...(sub.raw || {}), validatedBy: adminId, validatedAt: now };
  await sub.save();

  // 4. Mise à jour du document global User
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

  // ✅ FIX: On force l'envoi de l'email ici car le dispatcher ne le fait pas
  // On vérifie si c'est un renouvellement pour choisir le bon template de mail
  const isRenewal = await hasAnyHistory(sub.userId);
  await FmMetrixNotifier.notifyActivatedOrRenewed({
    userId: sub.userId,
    validUntil: periodEnd,
    dedupeKey: `crypto_approved:${sub._id}`, // Clé unique pour éviter les doublons
    isRenewal: isRenewal,
  });

  // 5. Envoi vers le Dispatcher Global (on le garde pour les commissions, stats, etc.)
  try {
    const event = await convertManualCryptoDocumentToEvent(sub, "succeeded");
    console.log(
      `[Service] Approbation Crypto - Dispatch event pour sub ${sub._id}`,
    );
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
 * ✅ Accès manuel : mail dédié (pas activated/renewed)
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

  // ✅ Notif + Email MANUAL GRANT
  await FmMetrixNotifier.notifyManualGrant({
    userId: String(userId),
    validUntil: end,
    months: m || null,
    adminEmail: adminEmail || "",
    dedupeKey: `manual_grant:${String(subDoc._id)}`,
  });

  return { doc, subDoc };
}

/**
 * ✅ Résiliation / révocation : envoie email + notif
 */
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

module.exports = {
  createCheckoutSession,
  confirmSessionAndActivate,
  approveCryptoPayment,
  grantManualAccess,
  revokeAccess,
  upsertFmMetrixFromStripeSession,
};
