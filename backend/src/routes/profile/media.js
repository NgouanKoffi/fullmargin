// backend/src/routes/profile/media.js
const express = require("express");
const multer = require("multer");

const User = require("../../models/user.model");
const { ok, fail, verifyAuthHeader } = require("../auth/_helpers");
const { uploadBuffer } = require("../../utils/storage");
const { recordAudit } = require("../../utils/audit"); // ✅ UserAudit

const router = express.Router();

/* -------------------- Auth -------------------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req); // synchrone
    if (!a || !a.userId) return fail(res, "Non autorisé", 401);
    req.auth = { userId: a.userId };
    next();
  } catch {
    return fail(res, "Non autorisé", 401);
  }
}

/* -------------------- Multer (mémoire) -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype)) {
      return cb(new Error("TYPE_NOT_ALLOWED"));
    }
    cb(null, true);
  },
});

/* =======================================================================
 *  POST /api/profile/avatar
 *  - Upload → Bunny (ou Cloudinary) dans "avatars"
 *  - 🔥 Nouveau : NOM UNIQUE à chaque upload → pas de réutilisation
 *  - Stocke l'URL dans User.avatarUrl
 * ======================================================================= */
router.post("/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) return fail(res, "Aucun fichier reçu", 400);

    const userId = req.auth.userId;
    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Utilisateur introuvable", 404);

    // 🔥 nom de fichier unique (user + timestamp)
    const publicId = `u_${userId}_${Date.now()}`;

    const up = await uploadBuffer(req.file.buffer, {
      folder: "avatars",
      publicId,
    });

    await User.findByIdAndUpdate(userId, {
      $set: { avatarUrl: up.secure_url },
    }).exec();

    await recordAudit(req, userId, "avatar.update", {
      fromUrl: user.avatarUrl || "",
      toUrl: up.secure_url,
    });

    return ok(res, { url: up.secure_url });
  } catch (err) {
    if (err?.message === "TYPE_NOT_ALLOWED") {
      return fail(res, "Type de fichier interdit (image uniquement)", 415);
    }
    if (err?.code === "LIMIT_FILE_SIZE") {
      return fail(res, "Image trop lourde (max 8MB)", 413);
    }

    console.error("POST /profile/avatar:", err?.message || err);
    return fail(res, "Échec de l’upload");
  }
});

/* =======================================================================
 *  POST /api/profile/cover
 *  - Upload → Bunny (ou Cloudinary) dans "covers"
 *  - 🔥 même logique : nom unique
 *  - Stocke l'URL dans User.coverUrl
 * ======================================================================= */
router.post("/cover", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) return fail(res, "Aucun fichier reçu", 400);

    const userId = req.auth.userId;
    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Utilisateur introuvable", 404);

    const publicId = `u_${userId}_${Date.now()}`;

    const up = await uploadBuffer(req.file.buffer, {
      folder: "covers",
      publicId,
    });

    await User.findByIdAndUpdate(userId, {
      $set: { coverUrl: up.secure_url },
    }).exec();

    await recordAudit(req, userId, "cover.update", {
      fromUrl: user.coverUrl || "",
      toUrl: up.secure_url,
    });

    return ok(res, { url: up.secure_url });
  } catch (err) {
    if (err?.message === "TYPE_NOT_ALLOWED") {
      return fail(res, "Type de fichier interdit (image uniquement)", 415);
    }
    if (err?.code === "LIMIT_FILE_SIZE") {
      return fail(res, "Image trop lourde (max 8MB)", 413);
    }

    console.error("POST /profile/cover:", err?.message || err);
    return fail(res, "Échec de l’upload");
  }
});

module.exports = router;
