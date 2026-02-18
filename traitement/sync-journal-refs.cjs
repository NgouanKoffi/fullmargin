// sync-journal-refs.cjs
// Supprime & remplace journalaccounts, markets, strategies
// puis génère un JSON de mapping wpAccountId/wpMarketId/wpStrategyId -> _id Mongo

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

// 2️⃣ Charger la config du backend pour récupérer MONGO_URI
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

// noms de collections
const JOURNAL_ACCOUNTS_COLLECTION = "journalaccounts";
const MARKETS_COLLECTION = "markets";
const STRATEGIES_COLLECTION = "strategies";

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
  console.log("🔗 Connexion à :", MONGO_URI);
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);

  const journalCol = db.collection(JOURNAL_ACCOUNTS_COLLECTION);
  const marketsCol = db.collection(MARKETS_COLLECTION);
  const strategiesCol = db.collection(STRATEGIES_COLLECTION);

  // 3️⃣ Charger les JSON convertis à la racine
  const accountsJsonPath = path.join(
    __dirname,
    "wp_compte_journal_converted.json"
  );
  const marketsJsonPath = path.join(__dirname, "wp_marches_converted.json");
  const strategiesJsonPath = path.join(
    __dirname,
    "wp_strategies_converted.json"
  );

  if (
    !fs.existsSync(accountsJsonPath) ||
    !fs.existsSync(marketsJsonPath) ||
    !fs.existsSync(strategiesJsonPath)
  ) {
    console.error(
      "❌ Un ou plusieurs fichiers JSON convertis sont introuvables."
    );
    console.error("Vérifie la présence de :");
    console.error(" -", accountsJsonPath);
    console.error(" -", marketsJsonPath);
    console.error(" -", strategiesJsonPath);
    process.exit(1);
  }

  const accountsData = JSON.parse(fs.readFileSync(accountsJsonPath, "utf8"));
  const marketsData = JSON.parse(fs.readFileSync(marketsJsonPath, "utf8"));
  const strategiesData = JSON.parse(
    fs.readFileSync(strategiesJsonPath, "utf8")
  );

  const accountsDocs = accountsData.map((d) => fixDates({ ...d }));
  const marketsDocs = marketsData.map((d) => fixDates({ ...d }));
  const strategiesDocs = strategiesData.map((d) => fixDates({ ...d }));

  console.log(
    "📦 Comptes totaux (avec doublons éventuels) :",
    accountsDocs.length
  );
  console.log("📦 Marchés totaux :", marketsDocs.length);
  console.log("📦 Stratégies totales :", strategiesDocs.length);

  // 4️⃣ Dédoublonnage par (user, name) pour les comptes, marchés, stratégies

  // ---- Comptes de journal ----
  const uniqueAccounts = [];
  const accKeyToIndex = new Map(); // key user::NAME -> index dans uniqueAccounts

  for (const doc of accountsDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    if (!accKeyToIndex.has(key)) {
      accKeyToIndex.set(key, uniqueAccounts.length);
      uniqueAccounts.push(doc);
    } else {
      console.log(
        `ℹ️ Doublon compte ignoré (user+name) pour wpAccountId=${doc.wpAccountId}, name="${doc.name}"`
      );
    }
  }

  console.log("📦 Comptes uniques à insérer :", uniqueAccounts.length);

  // ---- Marchés ----
  const uniqueMarkets = [];
  const mkKeyToIndex = new Map();

  for (const doc of marketsDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    if (!mkKeyToIndex.has(key)) {
      mkKeyToIndex.set(key, uniqueMarkets.length);
      uniqueMarkets.push(doc);
    } else {
      console.log(
        `ℹ️ Doublon marché ignoré (user+name) pour wpMarketId=${doc.wpMarketId}, name="${doc.name}"`
      );
    }
  }

  console.log("📦 Marchés uniques à insérer :", uniqueMarkets.length);

  // ---- Stratégies ----
  const uniqueStrategies = [];
  const stKeyToIndex = new Map();

  for (const doc of strategiesDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    if (!stKeyToIndex.has(key)) {
      stKeyToIndex.set(key, uniqueStrategies.length);
      uniqueStrategies.push(doc);
    } else {
      console.log(
        `ℹ️ Doublon stratégie ignoré (user+name) pour wpStrategyId=${doc.wpStrategyId}, name="${doc.name}"`
      );
    }
  }

  console.log("📦 Stratégies uniques à insérer :", uniqueStrategies.length);

  // 5️⃣ On vide les collections
  console.log("🧹 Suppression des anciennes données...");
  await journalCol.deleteMany({});
  await marketsCol.deleteMany({});
  await strategiesCol.deleteMany({});
  console.log("✅ Collections vidées.");

  // 6️⃣ Inserts
  console.log("⬆️ Insertion des comptes de journal...");
  const accountsInsertResult = await journalCol.insertMany(uniqueAccounts);
  console.log("✅ Comptes insérés :", accountsInsertResult.insertedCount);

  console.log("⬆️ Insertion des marchés...");
  const marketsInsertResult = await marketsCol.insertMany(uniqueMarkets);
  console.log("✅ Marchés insérés :", marketsInsertResult.insertedCount);

  console.log("⬆️ Insertion des stratégies...");
  const strategiesInsertResult = await strategiesCol.insertMany(
    uniqueStrategies
  );
  console.log("✅ Stratégies insérées :", strategiesInsertResult.insertedCount);

  // 7️⃣ Construire les maps user+name -> mongoId (pour les uniques)

  const accKeyToMongoId = new Map();
  for (const [key, index] of accKeyToIndex.entries()) {
    const mongoId = accountsInsertResult.insertedIds[index];
    if (mongoId) {
      accKeyToMongoId.set(key, mongoId.toString());
    }
  }

  const mkKeyToMongoId = new Map();
  for (const [key, index] of mkKeyToIndex.entries()) {
    const mongoId = marketsInsertResult.insertedIds[index];
    if (mongoId) {
      mkKeyToMongoId.set(key, mongoId.toString());
    }
  }

  const stKeyToMongoId = new Map();
  for (const [key, index] of stKeyToIndex.entries()) {
    const mongoId = strategiesInsertResult.insertedIds[index];
    if (mongoId) {
      stKeyToMongoId.set(key, mongoId.toString());
    }
  }

  // 8️⃣ Construire les mappings wpId -> mongoId
  const wpAccountIdToMongoId = {};
  for (const doc of accountsDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    const mongoId = accKeyToMongoId.get(key);
    if (doc.wpAccountId != null && mongoId) {
      wpAccountIdToMongoId[String(doc.wpAccountId)] = mongoId;
    }
  }

  const wpMarketIdToMongoId = {};
  for (const doc of marketsDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    const mongoId = mkKeyToMongoId.get(key);
    if (doc.wpMarketId != null && mongoId) {
      wpMarketIdToMongoId[String(doc.wpMarketId)] = mongoId;
    }
  }

  const wpStrategyIdToMongoId = {};
  for (const doc of strategiesDocs) {
    const key = `${doc.user}::${String(doc.name || "").toUpperCase()}`;
    const mongoId = stKeyToMongoId.get(key);
    if (doc.wpStrategyId != null && mongoId) {
      wpStrategyIdToMongoId[String(doc.wpStrategyId)] = mongoId;
    }
  }

  // 9️⃣ Écrire le JSON de mapping à la racine
  const mappingOut = {
    journalAccounts: wpAccountIdToMongoId,
    markets: wpMarketIdToMongoId,
    strategies: wpStrategyIdToMongoId,
  };

  const mappingPath = path.join(__dirname, "wpJournalId_to_mongoId.json");
  fs.writeFileSync(mappingPath, JSON.stringify(mappingOut, null, 2), "utf8");

  console.log("✅ Mapping wp*Id -> mongoId exporté →", mappingPath);
  console.log(
    "   - comptes   :",
    Object.keys(wpAccountIdToMongoId).length,
    "entrées"
  );
  console.log(
    "   - marchés   :",
    Object.keys(wpMarketIdToMongoId).length,
    "entrées"
  );
  console.log(
    "   - stratégies:",
    Object.keys(wpStrategyIdToMongoId).length,
    "entrées"
  );

  await client.close();
  console.log("🔌 Déconnexion MongoDB. Terminé.");
}

run().catch((err) => {
  console.error("❌ Erreur dans sync-journal-refs.cjs :", err);
  process.exit(1);
});
