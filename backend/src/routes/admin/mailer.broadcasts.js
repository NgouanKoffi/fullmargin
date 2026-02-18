// backend/src/routes/admin/mailer.broadcasts.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");

const { verifyAuthHeader } = require("../auth/_helpers");
const DiffusionGroup = require("../../models/diffusionGroup.model");
const MailBroadcast = require("../../models/mailBroadcast.model");
const { sendBulkEmail } = require("../../utils/mailer");

/* ----------------------------- Auth helpers ----------------------------- */
async function attachUser(req, _res, next) {
  try {
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
  if (!req.user?.id) return res.status(401).json({ error: "unauthorized" });
  next();
}
// ✅ autorise ADMIN **ou** AGENT
function requireStaff(req, res, next) {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  if (!(roles.includes("admin") || roles.includes("agent"))) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

/* ------------------------------ Uploads -------------------------------- */
const uploadDir = path.join(process.cwd(), "uploads", "mail");
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const id = Math.random().toString(36).slice(2);
    cb(null, `${Date.now()}_${id}_${file.originalname.replace(/\s+/g, "_")}`);
  },
});
const upload = multer({ storage });

/* ------------------------------ Helpers -------------------------------- */
function uniqEmails(arr) {
  return Array.from(
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
}

async function resolveGroupRecipients(groupIds) {
  const ids = (groupIds || [])
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  if (!ids.length) return [];
  const groups = await DiffusionGroup.find({ _id: { $in: ids } })
    .select("snapshotEmails")
    .lean();
  const emails = groups.flatMap((g) =>
    Array.isArray(g.snapshotEmails) ? g.snapshotEmails : []
  );
  return uniqEmails(emails);
}

async function buildAttachments(files) {
  return (files || []).map((f) => ({
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
    path: f.path, // chemin local (servi publiquement via /uploads)
  }));
}

/** Convertit un chemin local vers une URL publique /uploads/...  */
function toPublicUrl(fsPath) {
  try {
    if (!fsPath) return null;
    const rel = path.relative(path.join(process.cwd(), "uploads"), fsPath);
    if (!rel || rel.startsWith("..")) return null; // en dehors de /uploads => on n’expose pas
    return "/uploads/" + rel.split(path.sep).join("/");
  } catch {
    return null;
  }
}

/** Normalise la forme des pièces jointes côté client (ajoute l’URL publique). */
function mapAttachmentForClient(a) {
  return {
    name: a.name,
    type: a.type,
    size: a.size,
    url: toPublicUrl(a.path) || undefined,
  };
}

async function attachmentsToBase64(attachments) {
  const out = [];
  for (const a of attachments || []) {
    try {
      const buf = await fs.readFile(a.path);
      out.push({
        name: a.name,
        type: a.type,
        contentBase64: buf.toString("base64"),
      });
    } catch {
      // Si le fichier n’existe plus, on ignore silencieusement
    }
  }
  return out;
}

/* -------------------------------- Routes ------------------------------- */

/** GET /api/admin/mailer/broadcasts
 *  Liste des campagnes (avec URLs publiques des pièces jointes)  */
router.get(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
      const docs = await MailBroadcast.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const items = docs.map((d) => ({
        ...d,
        attachments: (d.attachments || []).map(mapAttachmentForClient),
      }));

      res.json({ items });
    } catch (e) {
      next(e);
    }
  }
);

/** GET /api/admin/mailer/broadcasts/:id
 *  Détail d’une campagne (y compris pièces jointes avec URL publique) */
router.get(
  "/:id",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "not_found" });
      const d = await MailBroadcast.findById(id).lean();
      if (!d) return res.status(404).json({ error: "not_found" });

      res.json({
        ...d,
        attachments: (d.attachments || []).map(mapAttachmentForClient),
      });
    } catch (e) {
      next(e);
    }
  }
);

/** GET /api/admin/mailer/broadcasts/:id/recipients
 *  Détail des destinataires (directs + groupes) */
router.get(
  "/:id/recipients",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "not_found" });
      }

      const doc = await MailBroadcast.findById(id).lean();
      if (!doc) return res.status(404).json({ error: "not_found" });

      const direct = uniqEmails(doc.toEmails || []);
      const groupEmails = await resolveGroupRecipients(doc.groupIds || []);
      const recipients = uniqEmails([...direct, ...groupEmails]);

      res.json({ ok: true, recipients, direct, groupIds: doc.groupIds || [] });
    } catch (e) {
      next(e);
    }
  }
);

/** PATCH /api/admin/mailer/broadcasts/:id/cancel
 *  Annule un envoi programmé (status doit être "scheduled"). */
router.patch(
  "/:id/cancel",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "not_found" });
      }
      const doc = await MailBroadcast.findById(id);
      if (!doc) return res.status(404).json({ error: "not_found" });

      if (doc.status !== "scheduled") {
        return res.status(400).json({ error: "not_cancellable" });
      }

      doc.status = "cancelled";
      await doc.save();
      res.json({ ok: true, broadcast: doc.toObject() });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /api/admin/mailer/broadcasts  (multipart form-data)
 *  Création d’une campagne + envoi immédiat si pas de sendAt */
router.post(
  "/",
  attachUser,
  requireAuth,
  requireStaff,
  upload.array("attachments"),
  async (req, res, next) => {
    try {
      const payload = JSON.parse(req.body.payload || "{}");
      const attachments = await buildAttachments(req.files);

      const doc = await MailBroadcast.create({
        createdBy: req.user.id,
        from: payload.from,
        groupIds: payload.groups || [],
        toEmails: uniqEmails(payload.toEmails || []),
        subject: payload.subject || "",
        bodyHtml: payload.bodyHtml || "",
        attachments,
        sendAt: payload.sendAt ? new Date(payload.sendAt) : null,
        status: payload.sendAt ? "scheduled" : "sending",
      });

      // Envoi immédiat en arrière-plan (ne bloque pas la réponse HTTP)
      if (!doc.sendAt) {
        setImmediate(() =>
          doSendNow(doc._id).catch((err) => {
            console.error("Broadcast send failed:", err?.message || err);
          })
        );
      }

      const fresh = await MailBroadcast.findById(doc._id).lean();
      res.json({
        ok: true,
        broadcast: {
          ...fresh,
          attachments: (fresh?.attachments || []).map(mapAttachmentForClient),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /api/admin/mailer/broadcasts/:id/send   (forcer envoi immédiat) */
router.post(
  "/:id/send",
  attachUser,
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      setImmediate(() =>
        doSendNow(req.params.id).catch((err) =>
          console.error("Forced send failed:", err?.message || err)
        )
      );
      const fresh = await MailBroadcast.findById(req.params.id).lean();
      res.json({
        ok: true,
        broadcast: {
          ...fresh,
          attachments: (fresh?.attachments || []).map(mapAttachmentForClient),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ----------------------------- Worker fn ------------------------------ */
async function doSendNow(id) {
  const doc = await MailBroadcast.findById(id).lean();
  if (!doc) throw new Error("not_found");
  if (doc.status === "done" || doc.status === "cancelled") return;

  const groupRecipients = await resolveGroupRecipients(doc.groupIds);
  const allRecipients = uniqEmails([
    ...(doc.toEmails || []),
    ...groupRecipients,
  ]);
  const attsB64 = await attachmentsToBase64(doc.attachments || []);

  // status → sending (idempotent)
  await MailBroadcast.updateOne(
    { _id: id },
    { $set: { status: "sending", "stats.requested": allRecipients.length } }
  );

  try {
    await sendBulkEmail({
      recipients: allRecipients,
      subject: doc.subject,
      html: doc.bodyHtml,
      fromEmail: doc.from?.email,
      fromName: doc.from?.name,
      attachments: attsB64,
    });

    await MailBroadcast.updateOne(
      { _id: id },
      { $set: { status: "done", "stats.sent": allRecipients.length } }
    );
  } catch (err) {
    await MailBroadcast.updateOne(
      { _id: id },
      {
        $set: {
          status: "failed",
          "stats.failed": allRecipients.length,
          "stats.lastError": String(err?.message || err),
        },
      }
    );
    throw err;
  }
}

module.exports = { router, doSendNow };
