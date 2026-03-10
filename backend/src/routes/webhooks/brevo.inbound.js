const express = require("express");
const router = express.Router();
const MailMessage = require("../../models/mailMessage.model");

// Utilitaire: fabrique un snippet court et propre
function makeSnippet(html = "", text = "") {
  const src = text && text.trim() ? text : String(html).replace(/<[^>]+>/g, " ");
  return src.replace(/\s+/g, " ").trim().slice(0, 180);
}

// Normalise un champ "to" potentiellement string/array/objets → array<string>
function normalizeToEmails(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x : x?.email))
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase());
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (raw?.email) return [String(raw.email).trim().toLowerCase()];
  return [];
}

/**
 * Brevo Inbound
 * Configure dans Brevo l’URL:
 *   POST https://<ton_domaine>/api/webhooks/brevo/inbound
 */
router.post("/inbound", express.json({ limit: "15mb" }), async (req, res) => {
  try {
    const b = req.body || {};

    const subject   = b.subject || b.Subject || "(Sans objet)";
    const fromEmail = b.from?.email || b.From || b.sender?.email || "";
    const fromName  = b.from?.name  || b.sender?.name  || "";

    // "to" peut venir sous différentes formes
    const toEmails  = normalizeToEmails(b.to || b.To || b.recipients);

    const bodyHtml  = b.html || b.Html || b.htmlContent || "";
    const bodyText  = b.text || b.Text || b.textContent || "";
    const snippet   = makeSnippet(bodyHtml, bodyText);

    // Horodatage si fourni
    const date =
      (b.date && new Date(b.date)) ||
      (b.Date && new Date(b.Date)) ||
      new Date();

    // Pièces jointes (optionnel, ici on ne stocke que les métadonnées)
    const attachments = Array.isArray(b.attachments || b.Attachments)
      ? (b.attachments || b.Attachments).map((a) => ({
          name: a.name || a.fileName || "file",
          type: a.type || a.contentType || undefined,
          size: a.size || a.length || undefined,
        }))
      : [];

    // Métadonnées de threading (si dispo)
    const messageId = b.messageId || b.MessageID || b["Message-Id"] || undefined;
    const inReplyTo = b.inReplyTo || b.InReplyTo || b["In-Reply-To"] || undefined;
    const threadKey = b.threadKey || undefined;

    await MailMessage.create({
      folder: "inbox",
      fromName,
      fromEmail,
      toEmails,        // <-- champs alignés avec le modèle & l’API /admin/mailbox
      subject,
      snippet,
      bodyHtml,
      bodyText,
      attachments,
      unread: true,
      starred: false,
      date,
      provider: "brevo",
      messageId,
      inReplyTo,
      threadKey,
    });

    // OK pour Brevo
    res.json({ ok: true });
  } catch (e) {
    console.error("[brevo/inbound] failed:", e?.message || e);
    res.status(500).json({ error: "server_error" });
  }
});

module.exports = { router };
