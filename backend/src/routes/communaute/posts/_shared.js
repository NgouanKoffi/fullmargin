// backend/src/routes/communaute/posts/_shared.js
const multer = require("multer");

// sharp optionnel
let sharp = null;
try {
  sharp = require("sharp");
} catch (e) {
  console.warn(
    "[communaute/posts] sharp non installé, les images seront envoyées brutes."
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const Community = require("../../../models/community.model");
const CommunityPost = require("../../../models/communityPost.model");
const CommunityPostLike = require("../../../models/communityPostLike.model");
const CommunityComment = require("../../../models/communityComment.model");
const CommunityMember = require("../../../models/communityMember.model"); // 👈 manquait dans ta version
const User = require("../../../models/user.model");
const { uploadBuffer } = require("../../../utils/storage");
const { verifyAuthHeader } = require("../../auth/_helpers");
const { createNotif } = require("../../../utils/notifications");

/* ---------- util compression image ---------- */
async function compressImageBuffer(buf) {
  if (!sharp) return buf;
  return sharp(buf)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

/* ---------- Auth helpers ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

function optionalAuth(req, _res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (a && a.userId) req.auth = { userId: a.userId, role: a.role || "user" };
  } catch {}
  next();
}

/* ---------- Droits (auteur ou owner) ---------- */
async function ensurePostWriteAccess(req, res, next) {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findOne({
      _id: id,
      deletedAt: null,
    }).lean();
    if (!post)
      return res.status(404).json({ ok: false, error: "Post introuvable" });

    const community = await Community.findOne({
      _id: post.communityId,
      deletedAt: null,
    })
      .select({ _id: 1, ownerId: 1, name: 1 })
      .lean();

    const isAuthor = String(post.authorId) === String(req.auth.userId);
    const isOwner =
      community && String(community.ownerId) === String(req.auth.userId);
    if (!isAuthor && !isOwner)
      return res.status(403).json({ ok: false, error: "Interdit" });

    req.post = post;
    req.community = community;
    next();
  } catch {
    return res.status(400).json({ ok: false, error: "Requête invalide" });
  }
}

module.exports = {
  upload,
  compressImageBuffer,
  requireAuth,
  optionalAuth,
  ensurePostWriteAccess,
  // on expose les modèles pour les handlers
  Community,
  CommunityPost,
  CommunityPostLike,
  CommunityComment,
  CommunityMember,
  User,
  uploadBuffer,
  createNotif,
};
