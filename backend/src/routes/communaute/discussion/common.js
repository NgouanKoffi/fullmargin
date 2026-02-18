// backend/src/routes/communaute/discussion/common.js
const multer = require("multer");
const {
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
} = require("../../../utils/storage");
const { verifyAuthHeader } = require("../../auth/_helpers");

const Community = require("../../../models/community.model");
const CommunityMember = require("../../../models/communityMember.model");
const CommunityGroup = require("../../../models/communityGroup.model");
const CommunityGroupMember = require("../../../models/communityGroupMember.model");
const CommunityPrivateThread = require("../../../models/communityPrivateThread.model");
const CommunityDiscussionMessage = require("../../../models/communityDiscussionMessage.model");
const User = require("../../../models/user.model");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 Mo max
    files: 5,
  },
});

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

async function getCommunityOr404(id, res) {
  try {
    const c = await Community.findOne({ _id: id, deletedAt: null }).lean();
    if (!c) {
      res.status(404).json({ ok: false, error: "Communauté introuvable" });
      return null;
    }
    return c;
  } catch {
    res.status(400).json({ ok: false, error: "Requête invalide" });
    return null;
  }
}

// ✅ OPTIMISÉ : Les fichiers s'envoient en parallèle vers Cloudinary
async function buildAttachments(files = []) {
  const uploadPromises = files.map(async (f) => {
    const mime = f.mimetype;
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    const isPdf = mime === "application/pdf";

    if (!isImage && !isVideo && !isPdf) return null;

    const safeName = f.originalname.replace(/\s+/g, "_");
    let baseName = safeName;
    if (isPdf) baseName = safeName.replace(/\.pdf$/i, "");

    const publicId = `${Date.now()}_${baseName}`;

    let uploaded;
    if (isImage) {
      uploaded = await uploadImageBuffer(f.buffer, {
        folder: "discussions/images",
        publicId,
      });
      return {
        kind: "image",
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        name: f.originalname,
        size: f.size,
        mimeType: mime,
      };
    } else if (isVideo) {
      uploaded = await uploadVideoBuffer(f.buffer, {
        folder: "discussions/videos",
        publicId,
      });
      return {
        kind: "video",
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        name: f.originalname,
        size: f.size,
        mimeType: mime,
      };
    } else if (isPdf) {
      uploaded = await uploadPdfBuffer(f.buffer, {
        folder: "discussions/pdf",
        publicId,
      });
      return {
        kind: "pdf",
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        name: f.originalname,
        size: f.size,
        mimeType: mime,
      };
    }
    return null;
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
}

module.exports = {
  upload,
  requireAuth,
  getCommunityOr404,
  buildAttachments,
  Community,
  CommunityMember,
  CommunityGroup,
  CommunityGroupMember,
  CommunityPrivateThread,
  CommunityDiscussionMessage,
  User,
};
