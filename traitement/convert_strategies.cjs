// C:\Users\ADMIN\Desktop\fullmargin-site\convert_strategies.cjs
const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// 1) Charger la map wpId → mongoId
const mapPath = path.join(__dirname, "wpId_to_mongoId.json");
const wpMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

// 2) Fichier CSV d'origine
const inputCsv = path.join(__dirname, "wp_strategies.csv");

// 3) Lecture du CSV
const csvData = fs.readFileSync(inputCsv, "utf8");

// 4) Parsing CSV
const rows = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

// Helper: convertit "2025-05-13 07:54:20" -> { "$date": "2025-05-13T07:54:20.000Z" }
function toMongoDate(sqlDate) {
  const raw = String(sqlDate || "").trim();
  if (!raw) return null;

  const iso = raw.replace(" ", "T") + ".000Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return { $date: d.toISOString() };
}

const out = [];

// Pour respecter l'index unique { user, name } tant que deletedAt = null
const seen = new Set();

for (const r of rows) {
  const wpUserId = Number(r.user_id);
  const mongoUserId = wpMap[wpUserId];

  if (!mongoUserId) {
    console.log(`⚠️ Aucun mapping pour user_id SQL = ${wpUserId}, ignoré.`);
    continue;
  }

  const name = String(r.strategie_name || "").trim();
  if (!name) {
    console.log(`⚠️ Ligne sans strategie_name (id=${r.id}), ignorée.`);
    continue;
  }

  // Détection de doublons (user + name)
  const key = `${mongoUserId}::${name.toUpperCase()}`;
  if (seen.has(key)) {
    console.log(
      `⚠️ Doublon détecté pour user=${mongoUserId}, name="${name}", ignoré.`
    );
    continue;
  }
  seen.add(key);

  let created = toMongoDate(r.created_at);
  if (!created) {
    created = { $date: new Date().toISOString() };
  }

  out.push({
    // ✅ on garde l'ID d'origine de la stratégie
    wpStrategyId: Number(r.id),

    // ✅ user mappé en mongoId
    user: mongoUserId,

    name,
    deletedAt: null,
    createdAt: created,
    updatedAt: created,
    // si un jour tu veux : description: r.description || ""
  });
}

// 6) Export JSON final
const outputJson = path.join(__dirname, "wp_strategies_converted.json");
fs.writeFileSync(outputJson, JSON.stringify(out, null, 2));

console.log("✅ Conversion terminée →", outputJson);
console.log("➡️ Total stratégies converties :", out.length);
