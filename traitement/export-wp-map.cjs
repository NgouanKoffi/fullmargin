// export-wp-map.cjs
// récupère tous les users avec legacyWp.wpId et écrit wpId_to_mongoId.json

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// 1️⃣ on force le chargement du .env du backend
// (C:\Users\ADMIN\Desktop\fullmargin-site\backend\.env)
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  // au cas où tu aurais un .env à la racine
  dotenv.config();
}

// 2️⃣ maintenant on peut require la config du backend
const backendCfg = require(path.join(
  __dirname,
  "backend",
  "src",
  "config",
  "env.js"
));

const MONGO_URI = backendCfg.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI est toujours vide. Vérifie :");
  console.error(" - que tu as bien un fichier backend/.env");
  console.error(" - qu'il contient une ligne MONGO_URI=mongodb://.....");
  process.exit(1);
}

// petit helper pour extraire le nom de base
function getDbNameFromUri(uri) {
  try {
    const u = new URL(uri);
    const db = u.pathname.replace("/", "");
    return db || "test";
  } catch (e) {
    return "test";
  }
}

const DB_NAME = getDbNameFromUri(MONGO_URI);
const USERS_COLLECTION = "users";

async function run() {
  console.log("🔗 Connexion à :", MONGO_URI);
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const usersCol = db.collection(USERS_COLLECTION);

  const users = await usersCol
    .find({ "legacyWp.wpId": { $exists: true } })
    .project({ _id: 1, "legacyWp.wpId": 1 })
    .toArray();

  const map = {};
  for (const u of users) {
    const wpId = Number(u.legacyWp.wpId);
    if (!isNaN(wpId)) {
      map[wpId] = u._id.toString();
    }
  }

  const outFile = path.join(__dirname, "wpId_to_mongoId.json");
  fs.writeFileSync(outFile, JSON.stringify(map, null, 2), "utf8");

  console.log("✅ map exportée →", outFile);
  console.log("➡️ total users avec wpId :", Object.keys(map).length);

  await client.close();
}

run().catch((err) => {
  console.error("❌ erreur :", err);
  process.exit(1);
});
