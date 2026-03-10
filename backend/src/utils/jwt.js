// backend/src/utils/jwt.js
const jwt = require("jsonwebtoken");

// Par défaut : 12h de durée de vie si non défini dans le .env
const { JWT_SECRET = "dev-secret", JWT_EXPIRES_IN = "7d" } = process.env;

/**
 * Signe un JWT avec le secret global et la durée par défaut (JWT_EXPIRES_IN).
 * On peut override via opts si besoin ponctuel.
 */
function sign(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...opts,
  });
}

/**
 * Vérifie un JWT.
 * Retourne le payload décodé ou null si invalide / expiré.
 */
function verify(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
