// sync-finance-accounts.cjs
// Remplace la collection financeaccounts par wp_finance_accounts_converted.json
// et génère un mapping wpFinanceAccountId -> _id Mongo

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

// helper pour extraire le nom de base depuis l'URI
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
const FINANCE_ACCOUNTS_COLLECTION = "financeaccounts";

// helper: transforme { "$date": "..." } en Date réelle
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
  // 3️⃣ Charger le JSON converti
  const accountsPath = path.join(
    __dirname,
    "wp_finance_accounts_converted.json"
  );

  if (!fs.existsSync(accountsPath)) {
    console.error(
      "❌ Fichier wp_finance_accounts_converted.json introuvable :",
      accountsPath
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(accountsPath, "utf8");
  const data = JSON.parse(raw);

  // ❗ On fixe les dates ET on caste user en ObjectId
  const docs = data.map((d) => {
    const fixed = fixDates({ ...d });
    return {
      ...fixed,
      user: new ObjectId(fixed.user), // 👈 cast en ObjectId
    };
  });

  console.log("📦 Comptes finance à insérer :", docs.length);

  console.log("🔗 Connexion à :", MONGO_URI);
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const col = db.collection(FINANCE_ACCOUNTS_COLLECTION);

  console.log("🧹 Suppression de l’ancienne collection financeaccounts...");
  await col.deleteMany({});
  console.log("✅ Anciennes entrées supprimées.");

  console.log("⬆️ Insertion des nouveaux comptes finance...");
  const res = await col.insertMany(docs);
  console.log("✅ Insertions terminées :", res.insertedCount);

  // 4️⃣ Construire le mapping wpFinanceAccountId -> _id Mongo
  const map = {};
  docs.forEach((doc, index) => {
    const mongoId = res.insertedIds[index];
    if (doc.wpFinanceAccountId != null && mongoId) {
      map[String(doc.wpFinanceAccountId)] = mongoId.toString();
    }
  });

  const mappingPath = path.join(
    __dirname,
    "wpFinanceAccountId_to_mongoId.json"
  );
  fs.writeFileSync(mappingPath, JSON.stringify(map, null, 2), "utf8");

  console.log(
    "✅ Mapping wpFinanceAccountId -> mongoId exporté →",
    mappingPath
  );
  console.log("   - entrées :", Object.keys(map).length);

  await client.close();
  console.log("🔌 Déconnexion MongoDB. Terminé.");
}

run().catch((err) => {
  console.error("❌ Erreur dans sync-finance-accounts.cjs :", err);
  process.exit(1);
});
