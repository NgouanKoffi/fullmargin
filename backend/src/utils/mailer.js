// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\utils\mailer.js
const MailTemplate = require("../models/mailTemplate.model");
const { DEFAULTS } = require("./mailer.defaults");
const { sendEmail } = require("./mailer.sendgrid");
const {
  normalizeCtx,
  renderTemplate,
  computeExpiryLabel,
} = require("./mailer.render");

async function loadTemplate(slug) {
  if (!slug) return null;
  return MailTemplate.findOne({ slug }).lean();
}

function withDefaults(slug) {
  return DEFAULTS[slug] || {};
}

async function renderAndSend(
  slug,
  { to, subjectFallback, htmlFallback, context = {} },
) {
  if (!to) return;

  const tpl = await loadTemplate(slug);
  const def = withDefaults(slug);

  const ctx = normalizeCtx(context);
  const subjectT =
    (tpl && tpl.subject) || def.subject || subjectFallback || "(Sans sujet)";
  const htmlT = (tpl && tpl.html) || def.html || htmlFallback || "";

  const subject = renderTemplate(subjectT, ctx);
  const html = renderTemplate(htmlT, ctx);

  return sendEmail({ to, subject, html });
}

/* =========================================================================
 * API PUBLIQUE
 * ========================================================================= */

// Auth
async function sendLoginCode(to, code) {
  if (process.env.NODE_ENV !== "production") console.log(`[2FA] Code: ${code}`);
  return renderAndSend("auth.login_code", { to, context: { code } });
}
async function sendWelcomeEmail(to, fullName = "") {
  const firstName = String(fullName || "").split(" ")[0] || "Bienvenue";
  return renderAndSend("auth.welcome", {
    to,
    context: { user: { firstName, fullName } },
  });
}
async function sendPasswordResetCode(to, code, minutes = 10) {
  if (process.env.NODE_ENV !== "production")
    console.log(`[RESET] Code: ${code}`);
  return renderAndSend("auth.password_reset_code", {
    to,
    context: { code, minutes },
  });
}

// Service
async function sendMembershipUpdateEmail({
  to,
  fullName = "",
  addedNames = [],
  removedNames = [],
  becameAgent = false,
  lostAgent = false,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "";
  return renderAndSend("service.membership_update", {
    to,
    context: {
      user: { firstName, fullName },
      addedNames,
      removedNames,
      becameAgent,
      lostAgent,
    },
  });
}
async function sendServiceDeletedEmail({
  to,
  fullName = "",
  serviceName = "",
  wasDemoted = false,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "";
  return renderAndSend("service.deleted", {
    to,
    context: {
      user: { firstName, fullName },
      service: { name: serviceName || "Service" },
      wasDemoted: !!wasDemoted,
    },
  });
}

// Marketplace Client
async function sendLicenseIssuedEmail({
  to,
  fullName = "",
  productTitle = "",
  licenseKey = "",
  expiresAt = null,
  isLifetime = false,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("marketplace.license_issued", {
    to,
    context: {
      user: { firstName, fullName },
      product: { title: productTitle || "Produit" },
      license: {
        key: String(licenseKey || "").trim(),
        expiresAt: computeExpiryLabel(expiresAt, isLifetime),
        isLifetime: !!isLifetime,
      },
    },
  });
}
async function sendLicenseRenewedEmail({
  to,
  fullName = "",
  productTitle = "",
  licenseKey = "",
  expiresAt = null,
  isLifetime = false,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("marketplace.license_renewed", {
    to,
    context: {
      user: { firstName, fullName },
      product: { title: productTitle || "Produit" },
      license: {
        key: String(licenseKey || "").trim(),
        expiresAt: computeExpiryLabel(expiresAt, isLifetime),
        isLifetime: !!isLifetime,
      },
    },
  });
}

// Email Succès Commande Stripe/Générique
async function sendMarketplaceOrderSuccessEmail({
  to,
  fullName = "",
  productTitle = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("marketplace.order_success", {
    to,
    context: {
      user: { firstName, fullName },
      product: { title: productTitle || "Produit" },
    },
  });
}

async function sendMarketplaceCryptoApprovedEmail({
  to,
  fullName = "",
  productTitle = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("marketplace.crypto_approved", {
    to,
    context: {
      user: { firstName, fullName },
      product: { title: productTitle || "Produit" },
    },
  });
}
async function sendMarketplaceCryptoRejectedEmail({
  to,
  fullName = "",
  productTitle = "",
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("marketplace.crypto_rejected", {
    to,
    context: {
      user: { firstName, fullName },
      product: { title: productTitle || "Produit" },
      reason: reason || "Raison non spécifiée",
    },
  });
}

// Notification Vendeur Marketplace
async function sendMarketplaceSaleNotificationEmail({
  to,
  fullName = "",
  customerName = "Un client",
  items = [], // [{ title, qty, amount }]
  totalEarnings = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Vendeur";
  return renderAndSend("marketplace.sale_notification", {
    to,
    context: {
      user: { firstName, fullName },
      customer: { name: customerName },
      items,
      totalEarnings,
    },
  });
}

// ✅ NOUVEAU : Notification Vendeur Formation (Cours)
async function sendCourseSaleNotificationEmail({
  to,
  fullName = "",
  buyerName = "Un client",
  courseTitle = "Formation",
  earnings = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Formateur";
  return renderAndSend("course.sale_notification", {
    to,
    context: {
      user: { firstName, fullName },
      buyer: { name: buyerName },
      course: { title: courseTitle },
      earnings,
    },
  });
}

// Withdrawal Approved
async function sendWithdrawalApprovedEmail({
  to,
  fullName = "",
  reference = "",
  amountNet = 0,
  method = "",
  proofUrl = null,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("finance.withdrawal_approved", {
    to,
    context: {
      user: { firstName, fullName },
      withdrawal: {
        reference,
        amountNet: `${Number(amountNet || 0).toFixed(2)} USD`,
        method,
        proofUrl: proofUrl || "",
        hasProof: !!proofUrl,
      },
    },
  });
}

// Withdrawal Rejected
async function sendWithdrawalRejectedEmail({
  to,
  fullName = "",
  reference = "",
  amountNet = 0,
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("finance.withdrawal_rejected", {
    to,
    context: {
      user: { firstName, fullName },
      withdrawal: {
        reference,
        amountNet: `${Number(amountNet || 0).toFixed(2)} USD`,
        reason: reason || "Raison non spécifiée",
      },
    },
  });
}

// FM Metrix
async function sendFmMetrixPremiumActivatedEmail({
  to,
  fullName = "",
  validUntil = null,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.premium_activated", {
    to,
    context: {
      user: { firstName, fullName },
      sub: { validUntil: computeExpiryLabel(validUntil, false) },
    },
  });
}
async function sendFmMetrixExpiringSoonEmail({
  to,
  fullName = "",
  validUntil = null,
  daysLeft = null,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.subscription_expiring", {
    to,
    context: {
      user: { firstName, fullName },
      sub: {
        validUntil: computeExpiryLabel(validUntil, false),
        daysLeft: daysLeft == null ? "" : String(daysLeft),
      },
    },
  });
}
async function sendFmMetrixRenewedEmail({
  to,
  fullName = "",
  validUntil = null,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.subscription_renewed", {
    to,
    context: {
      user: { firstName, fullName },
      sub: { validUntil: computeExpiryLabel(validUntil, false) },
    },
  });
}
async function sendFmMetrixExpiredEmail({
  to,
  fullName = "",
  validUntil = null,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.subscription_expired", {
    to,
    context: {
      user: { firstName, fullName },
      sub: { validUntil: computeExpiryLabel(validUntil, false) },
    },
  });
}
async function sendFmMetrixManualGrantEmail({
  to,
  fullName = "",
  validUntil = null,
  months = null,
  adminEmail = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.manual_grant", {
    to,
    context: {
      user: { firstName, fullName },
      sub: {
        validUntil: computeExpiryLabel(validUntil, false),
        months: months == null ? "" : String(months),
        adminEmail: adminEmail || "",
      },
    },
  });
}
async function sendFmMetrixCanceledEmail({
  to,
  fullName = "",
  endedAt = null,
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("fmmetrix.subscription_canceled", {
    to,
    context: {
      user: { firstName, fullName },
      sub: {
        endedAt: computeExpiryLabel(endedAt, false),
        reason: reason || "",
      },
    },
  });
}

// backend/src/utils/mailer.js

// backend/src/utils/mailer.js

async function sendAdminPromotionEmail(
  to,
  fullName = "",
  permissionsString = "",
  redirectLink = "https://fullmargin.net/admin",
) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("admin.user_promoted", {
    to,
    context: {
      user: { firstName, fullName },
      permissionsString,
      redirectUrl: redirectLink,
    },
  });
}

// ✅ LA FONCTION MANQUANTE POUR LA RÉTROGRADATION
async function sendAdminDemotionEmail(to, fullName = "") {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("admin.user_demoted", {
    to,
    context: { user: { firstName, fullName } },
  });
}

async function sendCommunityPostDeletedEmail({
  to,
  fullName = "",
  communityName = "",
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("community.post_deleted_by_admin", {
    to,
    context: {
      user: { firstName, fullName },
      community: { name: communityName },
      reason: reason || "Non respect du règlement",
    },
  });
}

// 📧 Email : demande de suppression de communauté approuvée par admin
async function sendCommunityDeletionApprovedEmail({
  to,
  fullName = "",
  communityName = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("community.deletion_approved", {
    to,
    subjectFallback: `Votre communauté "${communityName}" a été supprimée`,
    htmlFallback: `<p>Bonjour ${firstName},</p><p>Votre demande de suppression de la communauté <strong>${communityName}</strong> a été approuvée par nos administrateurs. La communauté a été définitivement fermée.</p><p>L'équipe FullMargin</p>`,
    context: {
      user: { firstName, fullName },
      community: { name: communityName },
    },
  });
}

// 📧 Email : avertissement envoyé par admin (1er ou 2ème)
async function sendCommunityWarningEmail({
  to,
  fullName = "",
  communityName = "",
  reason = "",
  warningCount = 1,
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  const remaining = 3 - warningCount;
  return renderAndSend("community.warning_issued", {
    to,
    subjectFallback: `⚠️ Avertissement (${warningCount}/3) – Communauté "${communityName}"`,
    htmlFallback: `<p>Bonjour ${firstName},</p><p>Votre communauté <strong>${communityName}</strong> a reçu un avertissement (${warningCount}/3) de la part de l'équipe FullMargin.</p><p><strong>Motif :</strong> ${reason || "Non-respect des règles"}</p><p>Il vous reste <strong>${remaining} avertissement(s)</strong> avant la fermeture automatique de votre communauté. Veuillez respecter les règles de la plateforme.</p><p>L'équipe FullMargin</p>`,
    context: {
      user: { firstName, fullName },
      community: { name: communityName },
      reason: reason || "Non-respect des règles",
      warningCount: String(warningCount),
      remaining: String(remaining),
    },
  });
}

// 📧 Email : communauté fermée suite à 3 avertissements
async function sendCommunityDeletedDueToWarningsEmail({
  to,
  fullName = "",
  communityName = "",
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("community.deleted_due_to_warnings", {
    to,
    subjectFallback: `🚨 Votre communauté "${communityName}" a été fermée`,
    htmlFallback: `<p>Bonjour ${firstName},</p><p>Suite à l'accumulation de 3 avertissements, votre communauté <strong>${communityName}</strong> a été définitivement fermée par l'équipe FullMargin.</p><p><strong>Dernier motif :</strong> ${reason || "Non-respect répété des règles"}</p><p>L'équipe FullMargin</p>`,
    context: {
      user: { firstName, fullName },
      community: { name: communityName },
      reason: reason || "Non-respect répété des règles",
    },
  });
}

// 📧 Email : communauté supprimée directement par admin (sans demande)
async function sendCommunityDeletedByAdminEmail({
  to,
  fullName = "",
  communityName = "",
  reason = "",
}) {
  const firstName = String(fullName || "").split(" ")[0] || "Bonjour";
  return renderAndSend("community.deleted_by_admin", {
    to,
    subjectFallback: `🚨 Votre communauté "${communityName}" a été suspendue`,
    htmlFallback: `<p>Bonjour ${firstName},</p><p>Votre communauté <strong>${communityName}</strong> a été suspendue par un administrateur FullMargin.</p><p><strong>Motif :</strong> ${reason || "Non-respect des règles de la plateforme"}</p><p>Si vous pensez que c'est une erreur, vous pouvez contacter notre équipe.</p><p>L'équipe FullMargin</p>`,
    context: {
      user: { firstName, fullName },
      community: { name: communityName },
      reason: reason || "Non-respect des règles de la plateforme",
    },
  });
}

module.exports = {
  sendEmail,
  sendLoginCode,
  sendWelcomeEmail,
  sendPasswordResetCode,
  sendMembershipUpdateEmail,
  sendServiceDeletedEmail,
  sendLicenseIssuedEmail,
  sendLicenseRenewedEmail,
  sendMarketplaceOrderSuccessEmail,
  sendMarketplaceCryptoApprovedEmail,
  sendMarketplaceCryptoRejectedEmail,
  sendMarketplaceSaleNotificationEmail,
  sendCourseSaleNotificationEmail,
  sendAdminPromotionEmail,
  sendAdminDemotionEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
  sendFmMetrixPremiumActivatedEmail,
  sendFmMetrixExpiringSoonEmail,
  sendFmMetrixRenewedEmail,
  sendFmMetrixExpiredEmail,
  sendFmMetrixManualGrantEmail,
  sendFmMetrixCanceledEmail,
  sendCommunityPostDeletedEmail,
  sendCommunityDeletionApprovedEmail,
  sendCommunityWarningEmail,
  sendCommunityDeletedDueToWarningsEmail,
  sendCommunityDeletedByAdminEmail,
  __MAIL_DEFAULTS: DEFAULTS,
};
