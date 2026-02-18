// convert_finance_tx.cjs
// Convertit wp_finance_transactions.csv -> wp_finance_transactions_converted.json
// en mappant user_id, account_id et en adaptant au modèle FinanceTx.

const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// 1) Charger les maps
const wpUserMapPath = path.join(__dirname, "wpId_to_mongoId.json");
const wpFinanceAccountMapPath = path.join(
  __dirname,
  "wpFinanceAccountId_to_mongoId.json"
);

if (!fs.existsSync(wpUserMapPath)) {
  console.error("❌ Fichier wpId_to_mongoId.json introuvable :", wpUserMapPath);
  process.exit(1);
}
if (!fs.existsSync(wpFinanceAccountMapPath)) {
  console.error(
    "❌ Fichier wpFinanceAccountId_to_mongoId.json introuvable :",
    wpFinanceAccountMapPath
  );
  process.exit(1);
}

const wpUserMap = JSON.parse(fs.readFileSync(wpUserMapPath, "utf8"));
const wpAccountMap = JSON.parse(
  fs.readFileSync(wpFinanceAccountMapPath, "utf8")
);

// 2) Fichier CSV d'origine
const inputCsv = path.join(__dirname, "wp_finance_transactions.csv");
if (!fs.existsSync(inputCsv)) {
  console.error(
    "❌ Fichier wp_finance_transactions.csv introuvable :",
    inputCsv
  );
  process.exit(1);
}

// 3) Lecture + parsing CSV
const csvData = fs.readFileSync(inputCsv, "utf8");
const rows = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

// Helpers de mapping

// transaction_type "Revenu"/"Dépense" --> type "income"/"expense"
function mapType(transactionType) {
  const v = String(transactionType || "")
    .toLowerCase()
    .trim();
  if (v === "revenu") return "income";
  if (v === "dépense" || v === "depense") return "expense";
  // si on ne sait pas, on met "expense" par défaut
  return "expense";
}

// recurrence --> "fixe" | "mensuel"
function mapRecurrence(r) {
  const v = String(r || "")
    .toLowerCase()
    .trim();
  if (v === "mensuel" || v === "mensuelle" || v === "monthly") return "mensuel";
  return "fixe"; // défaut
}

// detail --> enum ("epargne", "assurance", "retrait", "dette", "investissement", "autre")
function mapDetail(d) {
  const v = String(d || "")
    .toLowerCase()
    .trim();

  if (!v) return "autre";

  if (v.includes("épargne") || v.includes("epargne")) return "epargne";
  if (v.includes("assur")) return "assurance";
  if (v.includes("retrait")) return "retrait";
  if (v.includes("dette")) return "dette";
  if (v.includes("invest")) return "investissement";

  return "autre";
}

// "2025-05-04 09:59:00" -> { "$date": "2025-05-04T09:59:00.000Z" }
function toMongoDate(sqlDate) {
  const raw = String(sqlDate || "").trim();
  if (!raw) return null;

  const iso = raw.replace(" ", "T") + ".000Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return { $date: d.toISOString() };
}

const out = [];

let skippedNoUser = 0;
let skippedNoAccount = 0;
let skippedNoDate = 0;

for (const r of rows) {
  const wpUserId = Number(r.user_id);
  const mongoUserId = wpUserMap[wpUserId];

  if (!mongoUserId) {
    console.log(
      `⚠️ Aucun mapping user pour user_id=${wpUserId}, tx id=${r.id}, ignorée.`
    );
    skippedNoUser++;
    continue;
  }

  const wpAccountId = Number(r.account_id);
  const mongoAccountId = wpAccountMap[wpAccountId];

  if (!mongoAccountId) {
    console.log(
      `⚠️ Aucun mapping compte pour account_id=${wpAccountId}, tx id=${r.id}, ignorée.`
    );
    skippedNoAccount++;
    continue;
  }

  // date de la transaction
  let date = toMongoDate(r.date_transaction);
  if (!date) {
    date = toMongoDate(r.created_at);
  }
  if (!date) {
    console.log(`⚠️ Date invalide/absente pour tx id=${r.id}, ignorée.`);
    skippedNoDate++;
    continue;
  }

  const amount = Number(r.montant);
  if (!amount || isNaN(amount)) {
    console.log(
      `⚠️ Montant invalide pour tx id=${r.id} (montant="${r.montant}"), ignorée.`
    );
    continue;
  }

  let createdAt = toMongoDate(r.created_at);
  if (!createdAt) {
    createdAt = { $date: new Date().toISOString() };
  }

  let updatedAt = toMongoDate(r.updated_at);
  if (!updatedAt) {
    updatedAt = createdAt;
  }

  out.push({
    // ✅ garder l'ID d'origine pour debug
    wpFinanceTxId: Number(r.id),
    wpFinanceAccountId: wpAccountId,

    // ✅ mapping user / account
    user: mongoUserId,
    account: mongoAccountId,

    // modèle FinanceTx
    type: mapType(r.transaction_type),
    amount,
    date, // { $date: ... }

    recurrence: mapRecurrence(r.recurrence),
    detail: mapDetail(r.detail),
    comment: String(r.description || "").trim(),

    parentId: null,
    deletedAt: null,

    createdAt,
    updatedAt,
  });
}

const outputJson = path.join(
  __dirname,
  "wp_finance_transactions_converted.json"
);
fs.writeFileSync(outputJson, JSON.stringify(out, null, 2), "utf8");

console.log("✅ Conversion terminée →", outputJson);
console.log("➡️ Total lignes CSV :", rows.length);
console.log("➡️ Transactions converties :", out.length);
console.log("   - ignorées (no user)   :", skippedNoUser);
console.log("   - ignorées (no account):", skippedNoAccount);
console.log("   - ignorées (no date)   :", skippedNoDate);
