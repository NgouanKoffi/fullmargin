// sync-finance-tx.cjs
// Remplace la collection financetxes par wp_finance_transactions_converted.json

const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb"); // 👈 IMPORTANT
const dotenv = require("dotenv");

// 1️⃣ Charger le .env du backend
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// 2️⃣ Charger la config backend pour avoir MONGO_URI
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
// Mongoose: model "FinanceTx" -> collection "financetxes"
const FINANCE_TX_COLLECTION = "financetxes";

// helper: transforme { "$date": "..." } en Date réelle
function fixDates(doc) {
  if (doc.createdAt && doc.createdAt.$date) {
    doc.createdAt = new Date(doc.createdAt.$date);
  }
  if (doc.updatedAt && doc.updatedAt.$date) {
    doc.updatedAt = new Date(doc.updatedAt.$date);
  }
  if (doc.date && doc.date.$date) {
    doc.date = new Date(doc.date.$date);
  }
  if (doc.deletedAt && doc.deletedAt.$date) {
    doc.deletedAt = new Date(doc.deletedAt.$date);
  }
  return doc;
}

async function run() {
  const txPath = path.join(__dirname, "wp_finance_transactions_converted.json");

  if (!fs.existsSync(txPath)) {
    console.error(
      "❌ Fichier wp_finance_transactions_converted.json introuvable :",
      txPath
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(txPath, "utf8");
  const data = JSON.parse(raw);

  const docs = data.map((d) => {
    const fixed = fixDates({ ...d });
    return {
      ...fixed,
      user: new ObjectId(fixed.user), // 👈 cast en ObjectId
      account: new ObjectId(fixed.account), // 👈 cast en ObjectId
      parentId: fixed.parentId ? new ObjectId(fixed.parentId) : null,
    };
  });

  console.log("📦 Transactions finance à insérer :", docs.length);

  console.log("🔗 Connexion à :", MONGO_URI);
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const col = db.collection(FINANCE_TX_COLLECTION);

  console.log("🧹 Suppression de l’ancienne collection financetxes...");
  await col.deleteMany({});
  console.log("✅ Anciennes transactions supprimées.");

  console.log("⬆️ Insertion des nouvelles transactions...");
  const res = await col.insertMany(docs);
  console.log("✅ Insertions terminées :", res.insertedCount);

  await client.close();
  console.log("🔌 Déconnexion MongoDB. Terminé.");
}

run().catch((err) => {
  console.error("❌ Erreur dans sync-finance-tx.cjs :", err);
  process.exit(1);
});
