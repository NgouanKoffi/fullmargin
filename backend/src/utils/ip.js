const crypto = require("crypto");

function getClientIp(req) {
  // trust proxy activé → req.ip devrait suffire, mais on garde un fallback
  const xf = (req.headers["x-forwarded-for"] || "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let ip =
    xf[0] ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "";
  // normalise ::ffff:1.2.3.4
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

function hashIp(ip) {
  const salt = process.env.IP_SALT || "dev-salt-change-me";
  return crypto.createHmac("sha256", salt).update(ip || "").digest("hex");
}

module.exports = { getClientIp, hashIp };