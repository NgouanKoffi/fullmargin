// backend/src/routes/admin/mailbox.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");

const { verifyAuthHeader } = require("../auth/_helpers");
const MailMessage = require("../../models/mailMessage.model"); // inbox/trash
const MailBroadcast = require("../../models/mailBroadcast.model"); // sent
const DiffusionGroup = require("../../models/diffusionGroup.model");

/* -------------------- Auth helpers -------------------- */
function pickReqUser(req) {
  return (
    req.user ||
    req.auth?.user ||
    req.session?.user ||
    req.context?.user ||
    req.currentUser ||
    null
  );
}
async function attachUser(req, _res, next) {
  try {
    if (pickReqUser(req)) return next();
    const { userId, roles, email } = verifyAuthHeader(req);
    if (userId)
      req.user = {
        id: userId,
        roles: Array.isArray(roles) ? roles : [],
        email,
      };
  } catch {}
  next();
}
function requireAuth(req, res, next) {
  const u = pickReqUser(req);
  if (!u) return res.status(401).json({ error: "unauthorized" });
  next();
}
// ✅ autorise ADMIN **ou** AGENT
function requireStaff(req, res, next) {
  const roles = Array.isArray(pickReqUser(req)?.roles)
    ? pickReqUser(req).roles
    : [];
  if (!(roles.includes("admin") || roles.includes("agent"))) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

/* ---------------------- Utils ------------------------ */
function stripHtml(html = "") {
  return String(html)
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, " • ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
const uniq = (arr) =>
  Array.from(
    new Set(
      (arr || [])
        .map((e) =>
          String(e || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  );

/** Convertit un chemin local uploads vers une URL publique /uploads/... */
function toPublicUrl(fsPath) {
  try {
    if (!fsPath) return null;
    const rel = path.relative(path.join(process.cwd(), "uploads"), fsPath);
    if (!rel || rel.startsWith("..")) return null;
    return "/uploads/" + rel.split(path.sep).join("/");
  } catch {
    return null;
  }
}
function mapAttachmentForClient(a = {}) {
  // tolère MailMessage.attachments { path|url } et MailBroadcast.attachments { path }
  const url = a.url || toPublicUrl(a.path);
  return {
    name: a.name,
    type: a.type,
    size: a.size,
    url: url || undefined,
  };
}

/* ---------------------- Mappers ---------------------- */
function mapMailMessageRow(m) {
  // tolère schémas: m.toEmails: string[] ou m.to: {email}[]
  const toEmails = Array.isArray(m.toEmails)
    ? m.toEmails
    : Array.isArray(m.to)
    ? m.to.map((t) => t?.email).filter(Boolean)
    : [];

  return {
    id: String(m._id),
    folder: m.folder,
    fromName: m.fromName || "",
    fromEmail: m.fromEmail || "",
    toEmails,
    subject: m.subject || "(Sans objet)",
    snippet:
      m.snippet ||
      stripHtml(m.bodyText || m.text || m.bodyHtml || m.html || "").slice(
        0,
        180
      ),
    date: m.date || m.createdAt || new Date(),
    unread: !!m.unread,
    starred: !!m.starred,
  };
}
function mapBroadcastRow(b, toEmailsResolved) {
  const text = stripHtml(b.bodyHtml || "");
  return {
    id: `bcast:${String(b._id)}`,
    folder: "sent",
    fromName: b?.from?.name || "Équipe FullMargin",
    fromEmail: b?.from?.email || "noreply@fullmargin.net",
    toEmails: toEmailsResolved, // déjà résolus (directs + groupes)
    subject: b.subject || "(Sans objet)",
    snippet: text.slice(0, 180),
    date: b.sendAt ? new Date(b.sendAt) : new Date(b.createdAt || Date.now()),
    unread: false,
    starred: false,
  };
}

/* ---------------- Destinataires broadcast (bulk) --------------- */
async function resolveRecipientsForBroadcasts(bcasts) {
  // Un seul fetch des groupes pour toutes les campagnes listées
  const allGroupIds = uniq(
    bcasts.flatMap((b) =>
      Array.isArray(b.groupIds) ? b.groupIds.map(String) : []
    )
  );
  const validIds = allGroupIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const groups = validIds.length
    ? await DiffusionGroup.find({ _id: { $in: validIds } })
        .select("snapshotEmails")
        .lean()
    : [];
  const byId = new Map(
    groups.map((g) => [String(g._id), uniq(g.snapshotEmails || [])])
  );

  return bcasts.map((b) => {
    const groupsEmails = uniq(
      (b.groupIds || []).flatMap((gid) => byId.get(String(gid)) || [])
    );
    const to = uniq([...(b.toEmails || []), ...groupsEmails]);
    return to;
  });
}

/* ======================= LIST ======================= */
/** GET /api/admin/mailbox/messages */
router.get(
  "/messages",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const folder = String(req.query.folder || "inbox").toLowerCase();
      const limit = Math.min(parseInt(req.query.limit || "100", 10), 500);
      const q = String(req.query.q || "").trim();

      let rows = [];

      if (folder === "sent") {
        // -> UNIQUEMENT mailbroadcasts
        const bcasts = await MailBroadcast.find(
          q
            ? {
                $or: [
                  { subject: new RegExp(q, "i") },
                  { "from.name": new RegExp(q, "i") },
                ],
              }
            : {}
        )
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();

        const resolvedLists = await resolveRecipientsForBroadcasts(bcasts);
        rows = bcasts.map((b, i) => mapBroadcastRow(b, resolvedLists[i]));
      } else {
        // inbox / trash depuis mailmessages
        const match = { folder };
        if (q) {
          match.$or = [
            { subject: new RegExp(q, "i") },
            { snippet: new RegExp(q, "i") },
            { fromName: new RegExp(q, "i") },
            { fromEmail: new RegExp(q, "i") },
          ];
        }
        const docs = await MailMessage.find(match)
          .sort({ date: -1, _id: -1 })
          .limit(limit)
          .lean();
        rows = docs.map(mapMailMessageRow);
      }

      res.json({ items: rows });
    } catch (e) {
      next(e);
    }
  }
);

/* ======================= DETAILS ======================= */
/** GET /api/admin/mailbox/messages/:id */
router.get(
  "/messages/:id",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = String(req.params.id || "");

      // Détail d’un broadcast (sent)
      if (id.startsWith("bcast:")) {
        const _id = id.split(":")[1];
        if (!mongoose.Types.ObjectId.isValid(_id))
          return res.status(404).json({ error: "not_found" });
        const b = await MailBroadcast.findById(_id).lean();
        if (!b) return res.status(404).json({ error: "not_found" });

        // Résoudre tous les destinataires (directs + groupes)
        const resolved = await resolveRecipientsForBroadcasts([b]);
        const toEmails = resolved[0] || [];

        res.json({
          id,
          folder: "sent",
          fromName: b?.from?.name || "",
          fromEmail: b?.from?.email || "",
          toEmails,
          subject: b.subject || "(Sans objet)",
          snippet: stripHtml(b.bodyHtml || "").slice(0, 180),
          bodyHtml: b.bodyHtml || "",
          bodyText: stripHtml(b.bodyHtml || ""),
          attachments: (b.attachments || []).map(mapAttachmentForClient),
          date: b.sendAt
            ? new Date(b.sendAt)
            : new Date(b.createdAt || Date.now()),
          unread: false,
          starred: false,
        });
        return;
      }

      // Détail d’un message (inbox/trash)
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "not_found" });
      const m = await MailMessage.findById(id).lean();
      if (!m) return res.status(404).json({ error: "not_found" });

      const toEmails = Array.isArray(m.toEmails)
        ? m.toEmails
        : Array.isArray(m.to)
        ? m.to.map((t) => t?.email).filter(Boolean)
        : [];

      res.json({
        id: String(m._id),
        folder: m.folder,
        fromName: m.fromName || "",
        fromEmail: m.fromEmail || "",
        toEmails,
        subject: m.subject || "(Sans objet)",
        snippet:
          m.snippet ||
          stripHtml(m.bodyText || m.text || m.bodyHtml || m.html || "").slice(
            0,
            180
          ),
        bodyHtml: m.bodyHtml || m.html || "",
        bodyText: m.bodyText || m.text || "",
        attachments: (m.attachments || []).map(mapAttachmentForClient),
        date: m.date || m.createdAt || new Date(),
        unread: !!m.unread,
        starred: !!m.starred,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ================== PATCH read/star (UNIQUEMENT inbox/trash) ================== */
router.patch(
  "/messages/:id/read",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "not_found" });
      await MailMessage.updateOne({ _id: id }, { $set: { unread: false } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/messages/:id/star",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "not_found" });
      const doc = await MailMessage.findById(id);
      if (!doc) return res.status(404).json({ error: "not_found" });
      doc.starred = !doc.starred;
      await doc.save();
      res.json({ ok: true, starred: doc.starred });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
