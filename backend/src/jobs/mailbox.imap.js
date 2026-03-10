// backend/src/jobs/mailbox.imap.js
const path = require("path");
const fs = require("fs/promises");
const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const MailMessage = require("../models/mailMessage.model");

/* -------------------- ENV helpers -------------------- */
function envBool(v, fallback = false) {
  if (v == null) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(v).toLowerCase());
}
function envInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
function readAnyEnv(...keys) {
  for (const k of keys) {
    if (process.env[k] != null) return process.env[k];
  }
  return undefined;
}

const LOOKBACK_DAYS = envInt(process.env.IMAP_LOOKBACK_DAYS, 14);
const ONLY_UNSEEN   = envBool(process.env.IMAP_ONLY_UNSEEN, true);

function readImapAccountsFromEnv() {
  const list = String(process.env.IMAP_ACCOUNTS || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const host   = readAnyEnv("IMAP_HOST") || "imap.hostinger.com";
  const port   = envInt(readAnyEnv("IMAP_PORT"), 993);
  const secure = envBool(readAnyEnv("IMAP_SECURE"), true);
  const box    = readAnyEnv("IMAP_BOX") || "INBOX";
  const pollMs = envInt(readAnyEnv("IMAP_POLL_MS"), 0); // 0 = IDLE

  return list.map((idRaw) => {
    const id = idRaw.trim();
    const U  = id.toUpperCase();
    const L  = id; // casse d’origine

    const user = readAnyEnv(`IMAP_${L}_USER`, `IMAP_${U}_USER`);
    const pass = readAnyEnv(`IMAP_${L}_PASS`, `IMAP_${U}_PASS`);
    const mainBox = readAnyEnv(`IMAP_${L}_BOX`, `IMAP_${U}_BOX`) || box;

    // ex: IMAP_noreply_EXTRA_BOXES=Spam,Junk
    const extra = readAnyEnv(`IMAP_${L}_EXTRA_BOXES`, `IMAP_${U}_EXTRA_BOXES`);
    const extraBoxes = String(extra || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    const secondaryPollMs = envInt(
      readAnyEnv(`IMAP_${L}_SECONDARY_POLL_MS`, `IMAP_${U}_SECONDARY_POLL_MS`),
      60_000
    );

    return {
      id,
      host, port, secure,
      box: mainBox,
      pollMs,
      user, pass,
      extraBoxes,
      secondaryPollMs,
    };
  }).filter(a => a.user && a.pass);
}

/* -------------------- Files helpers -------------------- */
async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }
function safeName(name = "file") {
  return String(name).replace(/[^\p{L}\p{N}\.\-_ ]/gu, "_");
}
async function saveAttachment(accId, att) {
  const now = Date.now();
  const baseDir = path.join(process.cwd(), "uploads", "mail", "inbound", accId);
  await ensureDir(baseDir);
  const name = `${now}_${safeName(att.filename || "file")}`;
  const full = path.join(baseDir, name);
  await fs.writeFile(full, att.content);
  const url = `/uploads/mail/inbound/${encodeURIComponent(accId)}/${encodeURIComponent(name)}`;
  return { name: att.filename || "file", type: att.contentType, size: att.size, url, path: full };
}

/* -------------------- Mail → DB -------------------- */
function pickAddr(obj) { return { name: obj?.name || "", email: obj?.address || "" }; }
function addrListToEmails(list) {
  return (Array.isArray(list) ? list : [])
    .map(x => x?.address).map(e => String(e || "").trim().toLowerCase()).filter(Boolean);
}
function snippetOf(html = "", text = "") {
  const src = text && text.trim()
    ? text
    : String(html)
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<li>/gi, " • ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
  return src.trim().slice(0, 180);
}
async function upsertInboundMessage(accId, parsed, attachments) {
  const messageId = parsed.messageId || null;
  const inReplyTo = parsed.inReplyTo || null;

  const from = pickAddr(parsed.from?.value?.[0]);
  const toEmails = addrListToEmails(parsed.to?.value || []);
  const bodyHtml = typeof parsed.html === "string" ? parsed.html : "";
  const bodyText = parsed.text || "";

  const doc = {
    folder: "inbox",
    fromName: from.name,
    fromEmail: from.email,
    toEmails,
    subject: parsed.subject || "",
    snippet: snippetOf(bodyHtml, bodyText),
    bodyHtml,
    bodyText,
    date: parsed.date || new Date(),
    unread: true,
    starred: false,
    threadKey: null,
    inReplyTo,
    messageId,
    provider: `imap:${accId}`,
    attachments,
  };

  if (messageId) {
    const existing = await MailMessage.findOne({ messageId }).lean();
    if (existing) {
      await MailMessage.updateOne({ _id: existing._id }, { $set: doc });
      return existing._id;
    }
  }
  const created = await MailMessage.create(doc);
  return created._id;
}

/* -------------------- IMAP core -------------------- */
function buildSearchCriteria() {
  const criteria = {};
  if (ONLY_UNSEEN) criteria.seen = false;
  if (LOOKBACK_DAYS > 0) criteria.since = new Date(Date.now() - LOOKBACK_DAYS * 86400 * 1000);
  return criteria;
}

async function fetchNewInBox(client, accId, boxName, labelForLog) {
  // Sélectionne la boîte
  await client.mailboxOpen(boxName);
  const criteria = buildSearchCriteria();

  // UIDs (robuste : on passe ensuite { uid: [...] } à fetch)
  const uids = await client.search(criteria, { uid: true });
  if (!uids.length) return 0;

  let count = 0;
  for await (const msg of client.fetch({ uid: uids }, { source: true })) {
    try {
      const parsed = await simpleParser(msg.source);
      const atts = [];
      if (Array.isArray(parsed.attachments)) {
        for (const a of parsed.attachments) {
          try { atts.push(await saveAttachment(accId, a)); }
          catch (e) { console.error(`[imap:${accId}] attachment save failed:`, e?.message || e); }
        }
      }
      await upsertInboundMessage(accId, parsed, atts);
      count += 1;
    } catch (e) {
      console.error(`[imap:${accId}] parse/fetch failed:`, e?.message || e);
    }
  }
  if (count > 0) {
    console.log(`[imap] fetched ${count} new message(s) for ${labelForLog}/${boxName}`);
  }
  return count;
}

async function runClient(acc) {
  const client = new ImapFlow({
    host: acc.host,
    port: acc.port,
    secure: acc.secure,
    auth: { user: acc.user, pass: acc.pass },
    logger: false,
  });

  const label = `${acc.id}<${acc.user}>`;
  client.on("close", () => console.warn(`[imap] disconnected: ${label}`));
  client.on("error", (err) => console.error(`[imap] error (${label}):`, err?.message || err));

  await client.connect();
  await client.mailboxOpen(acc.box);
  console.log(`[imap] connected: ${label} (${acc.box})`);

  // Statut initial (debug)
  try {
    const st = await client.status(acc.box, { messages: true, unseen: true });
    console.log(`[imap] status ${acc.id}/${acc.box}: messages=${st.messages} unseen=${st.unseen}`);
  } catch {}

  // 1) Import initial (boîte principale)
  await fetchNewInBox(client, acc.id, acc.box, label).catch(() => {});

  // 2) IDLE sur la boîte principale ou polling
  if (acc.pollMs && acc.pollMs > 0) {
    setInterval(() => fetchNewInBox(client, acc.id, acc.box, label).catch(() => {}), acc.pollMs);
  } else {
    client.on("exists", () => fetchNewInBox(client, acc.id, acc.box, label).catch(() => {}));
  }

  // 3) Polling boîtes secondaires (Spam/Junk…)
  for (const extra of acc.extraBoxes || []) {
    setInterval(async () => {
      try {
        await fetchNewInBox(client, acc.id, extra, label);
        // on revient sur la boîte principale pour garder l’IDLE actif
        await client.mailboxOpen(acc.box);
      } catch {}
    }, acc.secondaryPollMs || 60_000);
  }

  // Keep-alive
  setInterval(async () => { try { await client.noop(); } catch {} }, 5 * 60 * 1000);

  return client;
}

/* -------------------- Public API -------------------- */
let started = false;
async function startMailboxImap() {
  if (started) return;
  started = true;

  const accounts = readImapAccountsFromEnv();
  if (!accounts.length) {
    console.warn("[imap] no IMAP_ACCOUNTS configured, skipping.");
    return;
  }

  console.log("[imap] starting for accounts:", accounts.map(a => a.id).join(", "));

  for (const acc of accounts) {
    (async function loop() {
      for (;;) {
        try { await runClient(acc); return; }
        catch (e) {
          console.error(`[imap] fatal for ${acc.id}:`, e?.message || e, "— retrying in 10s");
          await new Promise(r => setTimeout(r, 10_000));
        }
      }
    })();
  }
}

module.exports = { startMailboxImap };