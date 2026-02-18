const multer = require("multer");
const crypto = require("node:crypto");

const { verifyAuthHeader } = require("../../auth/_helpers");
const Community = require("../../../models/community.model");
const CommunityGroup = require("../../../models/communityGroup.model");
const CommunityGroupMember = require("../../../models/communityGroupMember.model");
const CommunityMember = require("../../../models/communityMember.model");
const { uploadImageBuffer } = require("../../../utils/storage");

const MAX_NAME = 160;
const MAX_DESC = 2000;

const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    fields: 50,
    files: 1,
  },
});

function makeRid(req) {
  if (req._rid) return req._rid;
  req._rid =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return req._rid;
}

// renvoie une Map("groupId" -> nb membres actifs)
async function buildMembersCountMap(groups) {
  const ids = groups.map((g) => g._id);
  if (!ids.length) return new Map();

  const rows = await CommunityGroupMember.aggregate([
    { $match: { group: { $in: ids }, leftAt: null } },
    { $group: { _id: "$group", count: { $sum: 1 } } },
  ]);

  const map = new Map();
  rows.forEach((r) => {
    map.set(String(r._id), r.count);
  });
  return map;
}

module.exports = {
  MAX_NAME,
  MAX_DESC,
  clampStr,
  requireAuth,
  upload,
  makeRid,
  buildMembersCountMap,
  Community,
  CommunityGroup,
  CommunityGroupMember,
  CommunityMember,
  uploadImageBuffer,
  verifyAuthHeader,
};
