// convert_journaux.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// 1) Charger la map wpId → mongoId (utilisateur)
const mapPath = path.join(__dirname, "wpId_to_mongoId.json");
const wpMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

// 2) Charger les CSV de référence
const csvAccounts = fs.readFileSync(
  path.join(__dirname, "wp_compte_journal.csv"),
  "utf8"
);
const csvMarkets = fs.readFileSync(
  path.join(__dirname, "wp_marches.csv"),
  "utf8"
);
const csvStrategies = fs.readFileSync(
  path.join(__dirname, "wp_strategies.csv"),
  "utf8"
);

// Parsing
const accountRows = csv.parse(csvAccounts, {
  columns: true,
  skip_empty_lines: true,
});
const marketRows = csv.parse(csvMarkets, {
  columns: true,
  skip_empty_lines: true,
});
const strategyRows = csv.parse(csvStrategies, {
  columns: true,
  skip_empty_lines: true,
});

// 3) Construire des maps par ID SQL
const accountById = {}; // account_id -> { name }
for (const r of accountRows) {
  const id = String(r.id).trim();
  accountById[id] = {
    name: String(r.account_name || "").trim(),
  };
}

const marketById = {}; // marche_id -> { name }
for (const r of marketRows) {
  const id = String(r.id).trim();
  marketById[id] = {
    name: String(r.marche_name || "").trim(),
  };
}

const strategyById = {}; // strategie_id -> { name }
for (const r of strategyRows) {
  const id = String(r.id).trim();
  strategyById[id] = {
    name: String(r.strategie_name || "").trim(),
  };
}

// Helper: convertit "2025-05-13 07:54:20" -> { "$date": "2025-05-13T07:54:20.000Z" }
function toMongoDate(sqlDate) {
  const raw = String(sqlDate || "").trim();
  if (!raw) return null;

  const iso = raw.replace(" ", "T") + ".000Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return { $date: d.toISOString() };
}

// 4) Charger le CSV des journaux
const csvJournaux = fs.readFileSync(
  path.join(__dirname, "wp_journaux.csv"),
  "utf8"
);
const rows = csv.parse(csvJournaux, {
  columns: true,
  skip_empty_lines: true,
});

const out = [];

for (const r of rows) {
  const wpUserId = Number(r.user_id);
  const mongoUserId = wpMap[wpUserId];

  if (!mongoUserId) {
    console.log(
      `⚠️ Aucun mapping pour user_id SQL = ${wpUserId} (journal id=${r.id}), ignoré.`
    );
    continue;
  }

  // Mapping des comptes / marchés / stratégies
  const accountIdSql = String(r.account_id || "").trim();
  const marketIdSql = String(r.marche_id || "").trim();
  const strategyIdSql = String(r.strategie_id || "").trim();

  const accountRef = accountById[accountIdSql] || { name: "" };
  const marketRef = marketById[marketIdSql] || { name: "" };
  const strategyRef = strategyById[strategyIdSql] || { name: "" };

  if (!accountRef.name) {
    console.log(
      `⚠️ Aucun compte trouvé pour account_id=${accountIdSql} (journal id=${r.id}).`
    );
  }
  if (!marketRef.name) {
    console.log(
      `⚠️ Aucun marché trouvé pour marche_id=${marketIdSql} (journal id=${r.id}).`
    );
  }
  if (!strategyRef.name) {
    console.log(
      `⚠️ Aucune stratégie trouvée pour strategie_id=${strategyIdSql} (journal id=${r.id}).`
    );
  }

  // Respect stratégie : "oui" / "non" -> "Oui" / "Non"
  let respect = String(r.respect_strategie || "")
    .trim()
    .toLowerCase();
  if (respect === "oui") respect = "Oui";
  else if (respect === "non") respect = "Non";
  else respect = "";

  // Image
  const imageUrl = String(r.image || "").trim();
  const images = imageUrl ? [imageUrl] : [];

  // Dates
  let created = toMongoDate(r.created_at);
  if (!created) {
    created = { $date: new Date().toISOString() };
  }

  out.push({
    user: mongoUserId,

    // Références / libellés
    accountId: accountIdSql || "",
    accountName: accountRef.name,
    marketId: marketIdSql || "",
    marketName: marketRef.name,
    strategyId: strategyIdSql || "",
    strategyName: strategyRef.name,

    // Données métier
    order: String(r.ordre || "").trim(),
    lot: String(r.total_lot || "").trim(),

    result: String(r.resultat || "").trim(),
    detail: String(r.detail || "").trim(),

    invested: String(r.montant_investi || "").trim(),
    resultMoney: String(r.resultat_devise || "").trim(),
    resultPct: "", // pas de colonne dédiée dans le CSV

    respect,
    duration: String(r.duree || "").trim(),

    timeframes: [], // pas d'info dans le CSV
    session: "", // pas d'info dans le CSV

    comment: String(r.commentaire || "").trim(),

    imageDataUrl: "",
    imageUrl,
    images,

    date: String(r.date || "").trim(),

    deletedAt: null,

    createdAt: created,
    updatedAt: created,
  });
}

// 5) Export JSON final
const outputJson = path.join(__dirname, "wp_journaux_converted.json");
fs.writeFileSync(outputJson, JSON.stringify(out, null, 2));

console.log("✅ Conversion terminée →", outputJson);
console.log("➡️ Total journaux convertis :", out.length);
