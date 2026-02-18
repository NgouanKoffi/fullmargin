// backend/src/routes/auth/_helpers.js
const jwt = require("jsonwebtoken");

const LOGIN_TTL_SEC = 120;
const REGISTER_TTL_SEC = 120;

const ok = (res, payload = {}) => res.json({ ok: true, ...payload });
const fail = (res, error, extra = {}) =>
  res.json({ ok: false, error, ...extra });

const normalizeEmail = (s = "") => String(s).trim().toLowerCase();

function maskEmail(email) {
  const [name, dom] = String(email).split("@");
  if (!dom) return email;
  const head = name.slice(0, 2);
  const tail = name.slice(-1);
  return `${head}${"*".repeat(Math.max(1, name.length - 3))}${tail}@${dom}`;
}

/**
 * Convertit une durée texte (ex: "12h", "15m", "7d") en millisecondes.
 * Par défaut : 1h si format non reconnu.
 */
function parseExpMs(s) {
  const m = String(s).match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return u === "s"
    ? n * 1e3
    : u === "m"
    ? n * 6e4
    : u === "h"
    ? n * 36e5
    : n * 864e5;
}

/**
 * TTL de session côté frontend, basé sur JWT_EXPIRES_IN.
 * Si rien n’est défini → 12h par défaut.
 */
const SESSION_TTL_MS = parseExpMs(process.env.JWT_EXPIRES_IN || "12h");

function buildFrontendBase() {
  // priorité à ce que TU mets
  const explicit =
    process.env.PUBLIC_WEB_BASE_URL ||
    process.env.FRONT_ORIGIN ||
    process.env.VITE_PUBLIC_WEB_BASE;
  if (explicit) return explicit.replace(/\/+$/, "");

  const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
  if (isProd) {
    // fallback actuel : on reste sur le sous-domaine
    return "https://site.fullmargin.net";
  }
  return "http://localhost:5173";
}

function buildFrontendAuthSuccessUrl(session) {
  return (
    `${buildFrontendBase()}/auth/success` +
    `?token=${encodeURIComponent(session.token)}` +
    `&expiresAt=${encodeURIComponent(String(session.expiresAt))}` +
    `&user=${encodeURIComponent(JSON.stringify(session.user))}`
  );
}

function computeSessionKinds(roles) {
  const r = Array.isArray(roles) && roles.length ? roles : ["user"];
  const kinds = new Set(["user"]);
  if (r.includes("admin")) kinds.add("admin");
  if (r.includes("agent")) kinds.add("agent");
  return Array.from(kinds);
}

async function recordLogin(_req, _user, _method = "auth", _success = true) {
  return;
}

function verifyAuthHeader(req) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token)
      return { token: null, userId: null, roles: [], kinds: [], email: null };

    const secret = process.env.JWT_SECRET || "dev-secret-change-me";
    const decoded = jwt.verify(token, secret);

    const userId = decoded?.sub ?? null;
    const roles = Array.isArray(decoded?.roles)
      ? decoded.roles
      : decoded?.role
      ? [decoded.role]
      : [];
    const kinds = Array.isArray(decoded?.kinds) ? decoded.kinds : [];
    const email = decoded?.email ?? null;

    return { token, userId, roles, kinds, email };
  } catch {
    return { token: null, userId: null, roles: [], kinds: [], email: null };
  }
}

module.exports = {
  LOGIN_TTL_SEC,
  REGISTER_TTL_SEC,
  ok,
  fail,
  normalizeEmail,
  maskEmail,
  parseExpMs,
  SESSION_TTL_MS,
  buildFrontendBase,
  buildFrontendAuthSuccessUrl,
  computeSessionKinds,
  recordLogin,
  verifyAuthHeader,
};
