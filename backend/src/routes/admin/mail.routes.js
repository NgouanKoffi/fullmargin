// backend/src/routes/admin/mail.js
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const MailSettings = require("../../models/mailSettings.model");
const MailTemplate = require("../../models/mailTemplate.model");
const User = require("../../models/user.model"); // ⬅ pour (éventuelle) hydratation des rôles

const { uploadBuffer } = require("../../utils/storage");
const { buildFrontendBase, verifyAuthHeader } = require("../auth/_helpers"); // ✅ base URL + auth header

const router = express.Router();
const { isValidObjectId } = mongoose;

/* ======================================================================= */
/*                           AUTH MIDDLEWARES (robustes)                    */
/* ======================================================================= */
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

async function attachUserFromHeaderIfNeeded(req) {
  if (pickReqUser(req)) return;
  const { userId, roles, email } = verifyAuthHeader(req);
  if (!userId) return;
  req.user = { id: userId, roles: Array.isArray(roles) ? roles : [], email };
}

async function maybeHydrateUserRoles(u) {
  if (!u) return null;
  if (Array.isArray(u.roles) && u.roles.length) return u;
  const id = u._id || u.id;
  if (!id || !mongoose.isValidObjectId(id)) return u;
  const fresh = await User.findById(id).select("roles").lean();
  if (fresh?.roles) u.roles = fresh.roles;
  return u;
}

async function requireAuth(req, res, next) {
  try {
    await attachUserFromHeaderIfNeeded(req);
    const u = pickReqUser(req);
    if (!u) return res.status(401).json({ error: "unauthorized" });
    if (!u.id && u._id) u.id = String(u._id);
    req.user = u;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

// ✅ Autorise ADMIN **ou** AGENT (au lieu d’admin-only)
async function requireStaff(req, res, next) {
  try {
    const u = await maybeHydrateUserRoles(req.user);
    const roles = Array.isArray(u?.roles) ? u.roles : [];
    const ok = roles.includes("admin") || roles.includes("agent");
    if (!ok) return res.status(403).json({ error: "forbidden" });
    next();
  } catch {
    return res.status(403).json({ error: "forbidden" });
  }
}

/* ======================================================================= */
/*                                 UPLOADS                                  */
/* ======================================================================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
});

/* ======================================================================= */
/*                                 HELPERS                                  */
/* ======================================================================= */
function str(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function isImage(mime) {
  return /^image\//i.test(mime || "");
}

/* ======================================================================= */
/*                                 SIGNATURE                                */
/* ======================================================================= */

/** GET /api/admin/mail/signature */
router.get("/signature", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const APP_NAME = process.env.APP_NAME || "FullMargin";
    const APP_URL = process.env.APP_URL || buildFrontendBase();
    const MAIL_FROM = process.env.MAIL_FROM || "noreply@fullmargin.net";

    let doc = await MailSettings.findOne({ key: "global" }).lean();
    if (!doc) {
      // valeurs par défaut si rien en DB
      doc = {
        key: "global",
        fromName: APP_NAME,
        fromEmail: MAIL_FROM,
        signatureHtml: [
          `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.4;color:#111">`,
          `  <div><b>${APP_NAME}</b></div>`,
          `  <div>Support • <a href="${APP_URL}" target="_blank" rel="noreferrer">${APP_URL.replace(
            /^https?:\/\//,
            ""
          )}</a></div>`,
          `  <div style="margin-top:8px;color:#666">— L’équipe ${APP_NAME}</div>`,
          `</div>`,
        ].join("\n"),
        signatureImageUrl: "",
        updatedAt: new Date(),
        createdAt: new Date(),
      };
    }

    res.json({
      settings: {
        fromName: doc.fromName || "",
        fromEmail: doc.fromEmail || "",
        signatureHtml: doc.signatureHtml || "",
        signatureImageUrl: doc.signatureImageUrl || "",
        updatedAt: doc.updatedAt || null,
        createdAt: doc.createdAt || null,
      },
    });
  } catch (e) {
    next(e);
  }
});

/** PUT /api/admin/mail/signature  (sauvegarde) */
router.put("/signature", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { fromName, fromEmail, signatureHtml, signatureImageUrl } =
      req.body || {};

    // validations minimales
    const email = str(fromEmail).trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email expéditeur invalide." });
    }

    const payload = {
      fromName: str(fromName).trim(),
      fromEmail: email,
      signatureHtml: str(signatureHtml),
      signatureImageUrl: str(signatureImageUrl),
    };

    const updated = await MailSettings.findOneAndUpdate(
      { key: "global" },
      { $set: payload, ...(req.user?._id ? { updatedBy: req.user._id } : {}) },
      { new: true, upsert: true }
    ).lean();

    res.json({
      ok: true,
      settings: {
        fromName: updated.fromName || "",
        fromEmail: updated.fromEmail || "",
        signatureHtml: updated.signatureHtml || "",
        signatureImageUrl: updated.signatureImageUrl || "",
        updatedAt: updated.updatedAt || null,
        createdAt: updated.createdAt || null,
      },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/admin/mail/signature/upload-image  (Cloudinary) */
router.post(
  "/signature/upload-image",
  requireAuth,
  requireStaff,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Aucun fichier reçu." });
      if (!isImage(req.file.mimetype))
        return res
          .status(400)
          .json({ error: "Fichier non supporté (image uniquement)." });

      const folder = "mail/signature";
      const publicId = `sig_${Date.now()}`;
      const result = await uploadBuffer(req.file.buffer, { folder, publicId });
      const url = result?.secure_url || result?.url || "";

      if (!url)
        return res.status(500).json({ error: "Upload Cloudinary échoué." });
      res.json({ ok: true, url });
    } catch (e) {
      next(e);
    }
  }
);

/* ======================================================================= */
/*                                 TEMPLATES                                */
/* ======================================================================= */

/** GET /api/admin/mail/templates (liste) */
router.get("/templates", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const templates = await MailTemplate.find().sort({ updatedAt: -1 }).lean();
    res.json({
      items: templates.map((t) => ({
        id: String(t._id),
        name: t.name || "",
        description: t.description || "",
        subject: t.subject || "",
        html: t.html || "",
        createdAt: t.createdAt || null,
        updatedAt: t.updatedAt || null,
        slug: t.slug || "",
      })),
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/admin/mail/templates (création) */
router.post("/templates", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const {
      name,
      description = "",
      subject = "",
      html = "",
      slug = "",
    } = req.body || {};
    const cleanName = str(name).trim();
    if (!cleanName || cleanName.length < 2)
      return res.status(400).json({ error: "Nom invalide." });

    const created = await MailTemplate.create({
      name: cleanName,
      description: str(description),
      subject: str(subject),
      html: str(html),
      slug: str(slug).trim(),
    });

    res.status(201).json({
      id: String(created._id),
      name: created.name,
      description: created.description,
      subject: created.subject,
      html: created.html,
      slug: created.slug,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/admin/mail/templates/:id (lecture) */
router.get(
  "/templates/:id",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id))
        return res.status(400).json({ error: "id invalide." });
      const t = await MailTemplate.findById(id).lean();
      if (!t) return res.status(404).json({ error: "Template introuvable." });
      res.json({
        id: String(t._id),
        name: t.name,
        description: t.description,
        subject: t.subject,
        html: t.html,
        slug: t.slug || "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/** PUT /api/admin/mail/templates/:id (update) */
router.put(
  "/templates/:id",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id))
        return res.status(400).json({ error: "id invalide." });

      const patch = {};
      ["name", "description", "subject", "html", "slug"].forEach((k) => {
        if (k in req.body) patch[k] = str(req.body[k]);
      });
      if (typeof patch.name === "string") {
        patch.name = patch.name.trim();
        if (!patch.name || patch.name.length < 2) {
          return res.status(400).json({ error: "Nom invalide." });
        }
      }

      const updated = await MailTemplate.findByIdAndUpdate(id, patch, {
        new: true,
      }).lean();
      if (!updated)
        return res.status(404).json({ error: "Template introuvable." });

      res.json({
        id: String(updated._id),
        name: updated.name,
        description: updated.description,
        subject: updated.subject,
        html: updated.html,
        slug: updated.slug || "",
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/** DELETE /api/admin/mail/templates/:id (suppression) */
router.delete(
  "/templates/:id",
  requireAuth,
  requireStaff,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id))
        return res.status(400).json({ error: "id invalide." });
      const doc = await MailTemplate.findById(id).lean();
      if (!doc) return res.status(404).json({ error: "Template introuvable." });
      await MailTemplate.deleteOne({ _id: id });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /api/admin/mail/upload-image — pour insérer des images dans un template */
router.post(
  "/upload-image",
  requireAuth,
  requireStaff,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Aucun fichier reçu." });
      if (!isImage(req.file.mimetype))
        return res
          .status(400)
          .json({ error: "Fichier non supporté (image uniquement)." });

      const folder = "mail/templates";
      const publicId = `tpl_${Date.now()}`;
      const result = await uploadBuffer(req.file.buffer, { folder, publicId });
      const url = result?.secure_url || result?.url || "";

      if (!url)
        return res.status(500).json({ error: "Upload Cloudinary échoué." });
      res.json({ ok: true, url });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
