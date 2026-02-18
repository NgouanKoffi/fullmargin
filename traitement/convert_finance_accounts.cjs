// convert_finance_accounts.cjs
// Convertit wp_finance_accounts.csv -> wp_finance_accounts_converted.json
// en remplaçant user_id par le vrai mongoId et en conservant l'id d'origine.

const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// 1️⃣ Charger la map wpId → mongoId (déjà générée avec export-wp-map.cjs)
const mapPath = path.join(__dirname, "wpId_to_mongoId.json");
if (!fs.existsSync(mapPath)) {
  console.error("❌ Fichier wpId_to_mongoId.json introuvable :", mapPath);
  process.exit(1);
}
const wpMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

// 2️⃣ Fichier CSV d'origine
const inputCsv = path.join(__dirname, "wp_finance_accounts.csv");
if (!fs.existsSync(inputCsv)) {
  console.error("❌ Fichier wp_finance_accounts.csv introuvable :", inputCsv);
  process.exit(1);
}

// 3️⃣ Lecture du CSV
const csvData = fs.readFileSync(inputCsv, "utf8");

// 4️⃣ Parsing CSV
const rows = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

// Normalisation des devises, en cohérence avec FinanceAccountSchema
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
    "BTC",
    "ETH",
    "BNB",
    "USDT",
    "FCFA",
  ];

  return allowed.includes(v) ? v : "XOF";
}

// Helper: "2025-05-13 07:54:20" -> { "$date": "2025-05-13T07:54:20.000Z" }
function toMongoDate(sqlDate) {
  const raw = String(sqlDate || "").trim();
  if (!raw) return null;

  const iso = raw.replace(" ", "T") + ".000Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return { $date: d.toISOString() };
}

const out = [];

for (const r of rows) {
  const wpUserId = Number(r.user_id);
  const mongoUserId = wpMap[wpUserId];

  if (!mongoUserId) {
    console.log(
      `⚠️ Aucun mapping pour user_id SQL = ${wpUserId}, ligne id=${r.id}, ignorée.`
    );
    continue;
  }

  const name = String(r.account_name || "").trim();
  if (!name) {
    console.log(`⚠️ Ligne sans account_name (id=${r.id}), ignorée.`);
    continue;
  }

  let created = toMongoDate(r.created_at);
  if (!created) {
    created = { $date: new Date().toISOString() };
  }

  out.push({
    // ✅ on garde l'ID d'origine pour le futur mapping (transactions, etc.)
    wpFinanceAccountId: Number(r.id),

    // ✅ vrai user Mongo
    user: mongoUserId,

    // Champs du modèle FinanceAccount
    name,
    currency: normalizeCurrency(r.currency),
    initial: Number(r.initial_balance) || 0,
    description: String(r.description || "").trim(),

    deletedAt: null,
    createdAt: created,
    updatedAt: created,
  });
}

// 6️⃣ Export JSON final
const outputJson = path.join(__dirname, "wp_finance_accounts_converted.json");
fs.writeFileSync(outputJson, JSON.stringify(out, null, 2), "utf8");

console.log("✅ Conversion terminée →", outputJson);
console.log("➡️ Total comptes finance convertis :", out.length);
