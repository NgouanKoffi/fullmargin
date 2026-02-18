// backend/src/middlewares/auth.js
const { verify } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const h = String(req.headers.authorization || "");
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: "Unauthorized" });

  const payload = verify(m[1]);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  // Normalisation userId (au cas où ton JWT utilise id/sub)
  const userId =
    payload.userId || payload.id || payload._id || payload.sub || null;

  req.auth = { ...payload, userId };
  req.user = req.auth; // backward compatible

  next();
}

module.exports = { requireAuth };
