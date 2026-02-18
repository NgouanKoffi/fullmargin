// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\services\fmmetrixNotifier.service.js
"use strict";

const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const {
  sendFmMetrixPremiumActivatedEmail,
  sendFmMetrixRenewedEmail,
  sendFmMetrixManualGrantEmail,
  sendFmMetrixCanceledEmail,
} = require("../utils/mailer");

function pickFullName(u) {
  const p = u?.profile || {};
  return (
    p.fullName ||
    p.name ||
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

function pickFirstName(fullName) {
  return (
    String(fullName || "")
      .trim()
      .split(" ")[0] || "Bonjour"
  );
}

async function getUserContact(userId) {
  const u = await User.findById(userId).select("email profile").lean();
  if (!u?.email) return null;

  const fullName = pickFullName(u);
  const firstName = pickFirstName(fullName);

  return { email: u.email, fullName, firstName };
}

/**
 * Idempotence par (userId + kind + payload.dedupeKey)
 * => si déjà créé : on skip (donc pas double email)
 */
async function notifyOnce({ userId, kind, payload, sendEmailFn }) {
  const dedupeKey = payload?.dedupeKey ? String(payload.dedupeKey) : null;

  if (dedupeKey) {
    const exists = await Notification.findOne({
      userId,
      kind,
      "payload.dedupeKey": dedupeKey,
    })
      .select("_id")
      .lean();

    if (exists) return { ok: true, skipped: true, reason: "already_notified" };
  }

  await Notification.create({
    userId,
    kind,
    payload: payload || {},
    seen: false,
  });

  if (typeof sendEmailFn === "function") {
    try {
      await sendEmailFn();
    } catch (e) {
      console.warn("[fmmetrixNotifier] email failed:", e?.message || e);
    }
  }

  return { ok: true, skipped: false };
}

/**
 * Paiement (Stripe/Crypto) : activated vs renewed
 */
async function notifyActivatedOrRenewed({
  userId,
  validUntil,
  dedupeKey,
  isRenewal,
}) {
  const contact = await getUserContact(userId);
  if (!contact) return { ok: false, skipped: true, reason: "no_email" };

  const kind = isRenewal
    ? "fmmetrix.subscription_renewed"
    : "fmmetrix.premium_activated";

  const payload = isRenewal
    ? {
        feature: "fm-metrix",
        title: "Renouvellement Premium réussi ✅",
        message: "Votre abonnement FM-Metrix Premium a été renouvelé.",
        validUntil,
        dedupeKey,
      }
    : {
        feature: "fm-metrix",
        title: "Compte Premium activé 🎉",
        message:
          "Félicitations, votre compte est désormais Premium sur FM-Metrix.",
        validUntil,
        dedupeKey,
      };

  return notifyOnce({
    userId,
    kind,
    payload,
    sendEmailFn: async () => {
      if (isRenewal) {
        return sendFmMetrixRenewedEmail({
          to: contact.email,
          fullName: contact.fullName,
          validUntil,
        });
      }
      return sendFmMetrixPremiumActivatedEmail({
        to: contact.email,
        fullName: contact.fullName,
        validUntil,
      });
    },
  });
}

/**
 * ✅ Accès manuel (ADMIN GRANT) : mail dédié
 */
async function notifyManualGrant({
  userId,
  validUntil,
  months,
  adminEmail,
  dedupeKey,
}) {
  const contact = await getUserContact(userId);
  if (!contact) return { ok: false, skipped: true, reason: "no_email" };

  const kind = "fmmetrix.manual_grant";

  const payload = {
    feature: "fm-metrix",
    title: "Accès manuel accordé ✅",
    message: "Un accès FM-Metrix Premium vous a été accordé manuellement.",
    validUntil,
    months: months ?? null,
    adminEmail: adminEmail ?? null,
    dedupeKey,
  };

  return notifyOnce({
    userId,
    kind,
    payload,
    sendEmailFn: async () => {
      return sendFmMetrixManualGrantEmail({
        to: contact.email,
        fullName: contact.fullName,
        validUntil,
        months,
        adminEmail,
      });
    },
  });
}

/**
 * ✅ Résiliation / révocation : mail dédié
 */
async function notifyCanceled({ userId, endedAt, reason, dedupeKey }) {
  const contact = await getUserContact(userId);
  if (!contact) return { ok: false, skipped: true, reason: "no_email" };

  const kind = "fmmetrix.subscription_canceled";

  const payload = {
    feature: "fm-metrix",
    title: "Abonnement résilié",
    message: "Votre abonnement FM-Metrix Premium a été résilié.",
    endedAt,
    reason: reason || null,
    dedupeKey,
  };

  return notifyOnce({
    userId,
    kind,
    payload,
    sendEmailFn: async () => {
      return sendFmMetrixCanceledEmail({
        to: contact.email,
        fullName: contact.fullName,
        endedAt,
        reason,
      });
    },
  });
}

module.exports = {
  notifyActivatedOrRenewed,
  notifyManualGrant,
  notifyCanceled,
};
