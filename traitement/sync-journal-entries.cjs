// sync-journal-entries.cjs
// 🔄 Vide et remplit la collection journalentries
// à partir de wp_journaux_converted_with_mongoIds.json

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// 1️⃣ Charger le .env du backend
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// 2️⃣ Charger la config du backend (MONGO_URI)
const backendCfg = require(path.join(
  __dirname,
  "backend",
  "src",
  "config",
  "env.js"
));

const MONGO_URI = backendCfg.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI est vide. Vérifie backend/.env (MONGO_URI=...)");
  process.exit(1);
}

// helper pour extraire le nom de base
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
const JOURNAL_ENTRIES_COLLECTION = "journalentries";

// transforme { "$date": "..." } en Date réelle
function fixDates(doc) {
  if (doc.createdAt && doc.createdAt.$date) {
    doc.createdAt = new Date(doc.createdAt.$date);
  }
  if (doc.updatedAt && doc.updatedAt.$date) {
    doc.updatedAt = new Date(doc.updatedAt.$date);
  }
  return doc;
}

async function run() {
  const journauxPath = path.join(
    __dirname,
    "wp_journaux_converted_with_mongoIds.json"
  );

  if (!fs.existsSync(journauxPath)) {
    console.error("❌ Fichier introuvable :", journauxPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(journauxPath, "utf8"));
  const docs = raw.map((d) => fixDates({ ...d }));

  console.log("🔗 Connexion à :", MONGO_URI);
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const col = db.collection(JOURNAL_ENTRIES_COLLECTION);

  console.log("🧹 Suppression des anciennes journalentries…");
  await col.deleteMany({});
  console.log("✅ journalentries vidée.");

  console.log("⬆️ Insertion des nouvelles journalentries…");
  const res = await col.insertMany(docs);
  console.log("✅ journalentries insérées :", res.insertedCount);

  await client.close();
  console.log("🔌 Déconnexion MongoDB. Terminé.");
}

run().catch((err) => {
  console.error("❌ Erreur dans sync-journal-entries.cjs :", err);
  process.exit(1);
});
