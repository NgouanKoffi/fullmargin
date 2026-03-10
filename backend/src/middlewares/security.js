// backend/src/middlewares/security.js
const helmet = require("helmet");
const cors = require("cors");
const {
  NODE_ENV,
  CORS_ORIGIN,
  TRUST_PROXY,
  HSTS_MAX_AGE,
} = require("../config/env");

// Hébergeur des médias (Cloudinary)
const CLOUDINARY_ORIGIN = "https://res.cloudinary.com";

/**
 * Helper : détecter les sous-domaines de fullmargin.net
 */
function isFullmarginSubdomain(origin) {
  try {
    const url = new URL(origin);
    return (
      url.hostname === "fullmargin.net" ||
      url.hostname.endsWith(".fullmargin.net")
    );
  } catch {
    return false;
  }
}

function applySecurity(app) {
  /* Proxy & headers */
  app.set("trust proxy", TRUST_PROXY);
  app.disable("x-powered-by");

  /* --------- Origines autorisées (pour CORS & CSP.connectSrc) --------- */
  const allowed = (CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (NODE_ENV !== "production") {
    console.log("[security] CORS_ORIGIN allowed =", allowed);
  }

  /* Helmet (CSP en prod, CORP autorisé pour API) */
  app.use(
    helmet({
      contentSecurityPolicy:
        NODE_ENV === "production"
          ? {
              useDefaults: true,
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                fontSrc: ["'self'", "data:"],
                imgSrc: ["'self'", "data:", "blob:", CLOUDINARY_ORIGIN],
                mediaSrc: ["'self'", "data:", "blob:", CLOUDINARY_ORIGIN],
                // NB: La CSP de l'API n'affecte pas la page du front,
                // mais on reste propre sur les appels sortants de l'API.
                connectSrc: ["'self'", CLOUDINARY_ORIGIN, ...allowed],
                frameAncestors: ["'self'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  if (NODE_ENV === "production") {
    app.use(
      helmet.hsts({
        maxAge: Number(HSTS_MAX_AGE),
        includeSubDomains: true,
        preload: true,
      })
    );
  }

  /* ---------- CORS (avec credentials) ---------- */
  const corsOpts = {
    origin(origin, cb) {
      // Autorise server-to-server / healthchecks (pas d'Origin)
      if (!origin) return cb(null, true);

      // Autorise si présent dans la liste CORS_ORIGIN
      if (allowed.includes(origin)) return cb(null, true);

      // Autorise tous les sous-domaines de fullmargin.net
      if (isFullmarginSubdomain(origin)) return cb(null, true);

      if (NODE_ENV !== "production") {
        console.warn("[CORS] blocked origin:", origin);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    // ⚠️ IMPORTANT : lister explicitement les headers autorisés
    // → on ajoute Cache-Control & Pragma car le front les envoie
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "Accept",
      "Origin",
      "X-Requested-With",
      "X-CSRF-Token",
      "Cache-Control",
      "Pragma",
    ],

    exposedHeaders: ["Content-Length", "X-Request-Id"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOpts));
  // Répond explicitement aux préflights pour TOUS les chemins
  app.options("*", cors(corsOpts));

  /* (pas de compression/json ici) */
}

module.exports = { applySecurity };
