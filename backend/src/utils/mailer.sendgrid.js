// backend/src/utils/mailer.sendgrid.js
const sgMail = require("@sendgrid/mail");
const MailSettings = require("../models/mailSettings.model");
const { stripHtml } = require("./mailer.render");

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const ENV_FROM_EMAIL = process.env.MAIL_FROM || "noreply@fullmargin.net";
const ENV_FROM_NAME =
  process.env.MAIL_FROM_NAME || process.env.APP_NAME || "FullMargin";
const ENV_REPLY_TO = process.env.MAIL_REPLY_TO || undefined;

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
}

/* =========================================================================
 *                               SETTINGS CACHE
 * ========================================================================= */

let _settingsCache = { data: null, at: 0 };
const SETTINGS_TTL_MS = 60_000;

async function getMailSettingsCached() {
  const now = Date.now();
  if (_settingsCache.data && now - _settingsCache.at < SETTINGS_TTL_MS) {
    return _settingsCache.data;
  }
  const doc = await MailSettings.findOne({ key: "global" }).lean();
  _settingsCache = { data: doc || null, at: now };
  return _settingsCache.data;
}

/* =========================================================================
 *                           LOW-LEVEL SEND (SendGrid)
 * ========================================================================= */

async function sendEmail({
  to,
  subject,
  html,
  text,
  fromEmail,
  fromName,
  autoSignature = true,
  bcc = [],
  attachments = [],
}) {
  if (!SENDGRID_KEY) {
    console.warn("[SendGrid] SENDGRID_API_KEY manquant — email ignoré.");
    return { ok: false, skipped: true, reason: "missing_api_key" };
  }

  const settings = await getMailSettingsCached();

  const finalFromEmail = fromEmail || settings?.fromEmail || ENV_FROM_EMAIL;
  const finalFromName = fromName || settings?.fromName || ENV_FROM_NAME;

  let finalHtml = String(html || "");
  if (autoSignature) {
    let signatureHtml = settings?.signatureHtml || "";
    if (!signatureHtml) {
      signatureHtml = `
<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.4;color:#111">
  <div><b>${ENV_FROM_NAME}</b></div>
  <div>Support • <a href="https://fullmargin.net/" target="_blank" rel="noreferrer">fullmargin.net</a></div>
</div>`.trim();
    }
    const separator = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />`;
    finalHtml = `${finalHtml}\n${separator}\n${signatureHtml}`;
  }

  const finalText = text || stripHtml(finalHtml);

  const mappedAttachments =
    Array.isArray(attachments) && attachments.length
      ? attachments.map((a) => {
          const raw = String(a.contentBase64 || "");
          const base64 = raw.replace(/^data:.*;base64,/, "");
          return {
            content: base64,
            filename: a.name || "attachment",
            type: a.type || undefined,
            disposition: "attachment",
          };
        })
      : undefined;

  const msg = {
    to,
    from: { email: finalFromEmail, name: finalFromName },
    replyTo: ENV_REPLY_TO ? { email: ENV_REPLY_TO } : undefined,
    subject,
    html: finalHtml,
    text: finalText,
    ...(Array.isArray(bcc) && bcc.length ? { bcc } : {}),
    ...(mappedAttachments ? { attachments: mappedAttachments } : {}),
  };

  Object.keys(msg).forEach((k) => msg[k] === undefined && delete msg[k]);

  try {
    const [res] = await sgMail.send(msg);
    console.log(
      "[SendGrid] sent ok:",
      res?.statusCode,
      "to:",
      to,
      "from:",
      finalFromEmail,
    );
    return { ok: true, status: res?.statusCode || 202 };
  } catch (e) {
    const status = e?.code || e?.response?.statusCode;
    const body = e?.response?.body;
    console.error("[SendGrid] SEND FAILED:", {
      status,
      body,
      message: e?.message,
      to,
      from: finalFromEmail,
    });
    throw e;
  }
}

module.exports = { sendEmail, getMailSettingsCached };
