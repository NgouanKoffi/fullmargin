// backend/src/utils/hash.js
const crypto = require("crypto");
const { IP_SALT = "" } = process.env;

/** Hache une info sensible de façon stable (HMAC-SHA256 + salt) */
function hmac(value) {
  const h = crypto.createHmac("sha256", IP_SALT || "no_salt_set");
  h.update(String(value || ""));
  return h.digest("hex");
}

/** Empreinte pseudo-anonyme du visiteur (ip + ua) */
function hashVisitor(ip, ua) {
  return hmac(`${ip || ""}::${ua || ""}`).slice(0, 32);
}

module.exports = { hmac, hashVisitor };