// link_journaux_with_mongo_ids.cjs
// Remplace les accountId / marketId / strategyId (IDs WP)
// par les vrais _id Mongo en utilisant wpJournalId_to_mongoId.json

const fs = require("fs");
const path = require("path");

// 1️⃣ Chemins des fichiers
const journalJsonPath = path.join(__dirname, "wp_journaux_converted.json");
const mappingPath = path.join(__dirname, "wpJournalId_to_mongoId.json");

// 2️⃣ Vérifications de base
if (!fs.existsSync(journalJsonPath)) {
  console.error(
    "❌ Fichier wp_journaux_converted.json introuvable :",
    journalJsonPath
  );
  process.exit(1);
}
if (!fs.existsSync(mappingPath)) {
  console.error(
    "❌ Fichier wpJournalId_to_mongoId.json introuvable :",
    mappingPath
  );
  process.exit(1);
}

// 3️⃣ Chargement des données
const journaux = JSON.parse(fs.readFileSync(journalJsonPath, "utf8"));
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

const accountMap = mapping.journalAccounts || {};
const marketMap = mapping.markets || {};
const strategyMap = mapping.strategies || {};

console.log("🔎 Journaux à traiter :", journaux.length);
console.log(
  "🔗 Maps chargées : comptes =",
  Object.keys(accountMap).length,
  ", marchés =",
  Object.keys(marketMap).length,
  ", stratégies =",
  Object.keys(strategyMap).length
);

let missingAccount = 0;
let missingMarket = 0;
let missingStrategy = 0;

for (const entry of journaux) {
  // ⚠️ les accountId/marketId/strategyId dans ce JSON sont encore des IDs WP (ex: "15")
  const accKey = String(entry.accountId || "").trim();
  const mkKey = String(entry.marketId || "").trim();
  const stKey = String(entry.strategyId || "").trim();

  if (accKey) {
    const mongoId = accountMap[accKey];
    if (mongoId) {
      entry.accountId = mongoId; // ✅ remplace par le vrai _id Mongo
    } else {
      missingAccount++;
      // on laisse la valeur d'origine (ID WP) pour ne pas casser
      console.log(
        `⚠️ Aucun MongoId trouvé pour accountId (WP) = ${accKey}, user=${entry.user}, accountName="${entry.accountName}"`
      );
    }
  }

  if (mkKey) {
    const mongoId = marketMap[mkKey];
    if (mongoId) {
      entry.marketId = mongoId;
    } else {
      missingMarket++;
      console.log(
        `⚠️ Aucun MongoId trouvé pour marketId (WP) = ${mkKey}, user=${entry.user}, marketName="${entry.marketName}"`
      );
    }
  }

  if (stKey) {
    const mongoId = strategyMap[stKey];
    if (mongoId) {
      entry.strategyId = mongoId;
    } else {
      missingStrategy++;
      console.log(
        `⚠️ Aucun MongoId trouvé pour strategyId (WP) = ${stKey}, user=${entry.user}, strategyName="${entry.strategyName}"`
      );
    }
  }
}

// 4️⃣ Écriture du nouveau fichier
const outPath = path.join(
  __dirname,
  "wp_journaux_converted_with_mongoIds.json"
);
fs.writeFileSync(outPath, JSON.stringify(journaux, null, 2), "utf8");

console.log("✅ Traitement terminé.");
console.log("📄 Fichier généré :", outPath);
console.log("🔸 Journaux total :", journaux.length);
console.log("⚠️ Sans mapping compte   :", missingAccount);
console.log("⚠️ Sans mapping marché   :", missingMarket);
console.log("⚠️ Sans mapping stratégie:", missingStrategy);
