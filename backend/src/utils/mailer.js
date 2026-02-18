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

// ✅ NOUVEAU : Email Succès Commande Stripe/Générique
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

// Notification Vendeur
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

module.exports = {
  sendEmail,
  sendLoginCode,
  sendWelcomeEmail,
  sendPasswordResetCode,
  sendMembershipUpdateEmail,
  sendServiceDeletedEmail,
  sendLicenseIssuedEmail,
  sendLicenseRenewedEmail,
  sendMarketplaceOrderSuccessEmail, // ✅ Exporté
  sendMarketplaceCryptoApprovedEmail,
  sendMarketplaceCryptoRejectedEmail,
  sendMarketplaceSaleNotificationEmail,
  sendWithdrawalApprovedEmail, // ✅ Nouveau
  sendWithdrawalRejectedEmail, // ✅ Nouveau
  sendFmMetrixPremiumActivatedEmail,
  sendFmMetrixExpiringSoonEmail,
  sendFmMetrixRenewedEmail,
  sendFmMetrixExpiredEmail,
  sendFmMetrixManualGrantEmail,
  sendFmMetrixCanceledEmail,
  __MAIL_DEFAULTS: DEFAULTS,
};
