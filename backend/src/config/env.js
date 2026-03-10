// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\config\env.js
require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";

// en prod → on accepte direct le domaine principal + l'ancien sous-domaine
// en dev → localhost
const DEFAULT_CORS =
  NODE_ENV === "production"
    ? "https://fullmargin.net,https://www.fullmargin.net,https://site.fullmargin.net,https://www.site.fullmargin.net"
    : "http://localhost:5173";

const cfg = {
  NODE_ENV,
  PORT: Number(process.env.PORT || 5179),
  MONGO_URI: process.env.MONGO_URI || "",

  // ancienne chaîne
  CORS_ORIGIN: process.env.CORS_ORIGIN || DEFAULT_CORS,

  // nouvelle liste (on découpe proprement)
  CORS_ORIGINS: (
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.CORS_ORIGIN ||
    DEFAULT_CORS
  )
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),

  TRUST_PROXY: process.env.TRUST_PROXY || "1",
  HSTS_MAX_AGE: Number(process.env.HSTS_MAX_AGE || 15552000),
  IP_SALT: process.env.IP_SALT || "",
};

if (cfg.NODE_ENV === "test") {
  if (!process.env.MONGO_URI) {
    cfg.MONGO_URI = "mongodb://127.0.0.1:27017/fm_test";
  }
  if (!cfg.IP_SALT) {
    cfg.IP_SALT = "test-salt";
  }
}

if (!cfg.MONGO_URI && cfg.NODE_ENV !== "test") {
  console.error("❌ MONGO_URI manquant dans .env");
  process.exit(1);
}

module.exports = cfg;
