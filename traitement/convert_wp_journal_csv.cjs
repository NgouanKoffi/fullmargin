// C:\Users\ADMIN\Desktop\fullmargin-site\convert_wp_journal_csv.cjs
const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// Charger la map wpId → mongoId construite précédemment
const mapPath = path.join(__dirname, "wpId_to_mongoId.json");
const wpMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

// Fichier CSV d'origine
const inputCsv = path.join(__dirname, "wp_compte_journal.csv");

// Lire le CSV
const csvData = fs.readFileSync(inputCsv, "utf8");

// Parser CSV
const rows = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

// Normalisation des devises
function normalizeCurrency(c) {
  const v = String(c || "")
    .toUpperCase()
    .trim();
  if (v === "FCFA") return "XOF";
  if (v === "FCFA_BEAC") return "XAF";

  const allowed = [
    "USD",
    "EUR",
    "XOF",
    "XAF",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CNY",
    "CHF",
    "NGN",
    "ZAR",
    "MAD",
    "INR",
    "AED",
    "GHS",
    "KES",
    "FCFA",
  ];
  return allowed.includes(v) ? v : "USD";
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

// Conversion des lignes CSV → JSON
const out = [];

for (const r of rows) {
  const wpUserId = Number(r.user_id);
  const mongoUserId = wpMap[wpUserId];

  if (!mongoUserId) {
    console.log(`⚠️ Aucun mapping pour user_id SQL = ${wpUserId}, ignoré.`);
    continue;
  }

  const created = toMongoDate(r.created_at);

  out.push({
    // ✅ on CONSERVE l'ID d'origine du compte de journal
    wpAccountId: Number(r.id),

    // ✅ on remplace seulement le user_id par le vrai mongoId
    user: mongoUserId,

    // le reste comme avant
    name: r.account_name,
    currency: normalizeCurrency(r.currency),
    initial: Number(r.initial_balance) || 0,
    description: r.description || "",
    deletedAt: null,
    createdAt: created,
    updatedAt: created,
  });
}

// Export JSON final
const outputJson = path.join(__dirname, "wp_compte_journal_converted.json");
fs.writeFileSync(outputJson, JSON.stringify(out, null, 2));

console.log("✅ Conversion terminée →", outputJson);
console.log("➡️ Total comptes convertis :", out.length);
