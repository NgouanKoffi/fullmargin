// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\communauties\_shared.js
const multer = require("multer");
const { uploadImageBuffer } = require("../../../utils/storage");
const { verifyAuthHeader } = require("../../auth/_helpers");
const Community = require("../../../models/community.model");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

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

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function nameExistsCI(name, excludeId = null) {
  const q = {
    name: {
      $regex: new RegExp("^" + escapeRegex(String(name).trim()) + "$", "i"),
    },
    deletedAt: null,
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Boolean(await Community.exists(q));
}

module.exports = {
  upload,
  requireAuth,
  uploadImageBuffer,
  nameExistsCI,
  Community,
};
