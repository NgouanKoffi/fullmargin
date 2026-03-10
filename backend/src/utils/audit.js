const UserAudit = require("../models/userAudit.model");
const { getClientIp, hashIp } = require("./ip");

/**
 * Enregistre un événement d’audit.
 * @param {Request} req
 * @param {string|ObjectId} userId
 * @param {string} type  ex: "profile.update" | "avatar.update" | "cover.update" | "password.change"
 * @param {object} meta  ex: { changed: { fullName: {from, to}, city: {...} } }
 */
async function recordAudit(req, userId, type, meta = {}) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const ua = req.get("user-agent") || "";
    await UserAudit.create({ user: userId, type, ipHash, ua, meta });
  } catch (e) {
    console.error("[audit] save failed:", e?.message || e);
  }
}

module.exports = { recordAudit };