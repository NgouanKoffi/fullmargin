// backend/server.js
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// ======================================================
// 1. Chargement des .env
// ======================================================
function loadEnv() {
  const dir = __dirname;
  const loaded = [];

  // cas où on force un chemin
  if (process.env.DOTENV_CONFIG_PATH) {
    const p = path.resolve(process.env.DOTENV_CONFIG_PATH);
    dotenv.config({ path: p, override: true });
    loaded.push(p);
    console.log(`[env] Loaded (forced) ${p}`);
    return;
  }

  const envPath = path.join(dir, ".env");
  const envLocalPath = path.join(dir, ".env.local");
  const prodPath = path.join(dir, ".env.production");
  const prodLocalPath = path.join(dir, ".env.production.local");

  const hasEnv = fs.existsSync(envPath);
  const hasEnvLocal = fs.existsSync(envLocalPath);
  const hasProd = fs.existsSync(prodPath);
  const hasProdLocal = fs.existsSync(prodLocalPath);

  // 1) .env
  if (hasEnv) {
    dotenv.config({ path: envPath, override: false });
    loaded.push(envPath);
  }
  // 2) .env.local (override)
  if (hasEnvLocal) {
    dotenv.config({ path: envLocalPath, override: true });
    loaded.push(envLocalPath);
  }

  // 3) prod si NODE_ENV=production ou s’il n’y a pas de .env
  const shouldLoadProd =
    (process.env.NODE_ENV || "").toLowerCase() === "production" ||
    (!hasEnv && hasProd);

  if (shouldLoadProd && hasProd) {
    dotenv.config({ path: prodPath, override: true });
    loaded.push(prodPath);
  }
  if (shouldLoadProd && hasProdLocal) {
    dotenv.config({ path: prodLocalPath, override: true });
    loaded.push(prodLocalPath);
  }

  if (loaded.length === 0) {
    console.warn("[env] No .env files found — relying on process env only");
  } else {
    console.log(
      "[env] Loaded:",
      loaded.map((p) => path.basename(p)).join(", ")
    );
  }
}
loadEnv();

const { PORT, NODE_ENV } = require("./src/config/env");
const { connectMongo } = require("./src/db/mongo");
const app = require("./src/app");

// ======================================================
// 2. Lancement serveur
// ======================================================
const HOST = process.env.HOST || "0.0.0.0";

const PUBLIC_BASE =
  process.env.API_PUBLIC_BASE ||
  (NODE_ENV === "production"
    ? "https://api.fullmargin.net"
    : `http://localhost:${PORT}`);

(async () => {
  try {
    await connectMongo();
    app.listen(PORT, HOST, () => {
      console.log(`🚀 API up on ${PUBLIC_BASE} (${NODE_ENV})`);
    });
  } catch (err) {
    console.error("❌ Boot failed:", err?.stack || err?.message || err);
    process.exit(1);
  }
})();
