// convert-finance-csv.cjs
// 1ère passe FINANCE : on lit les CSV MySQL et on sort 2 JSON
// qui respectent TES colonnes. On garde les user_id et account_id WP,
// on garde les id SQL dans legacy, et on NE crée PAS de "type de compte".

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// chemins d'entrée
const CSV_ACCOUNTS = path.join(__dirname, "wp_finance_accounts.csv");
const CSV_TXS = path.join(__dirname, "wp_finance_transactions.csv");

// sorties
const OUT_ACCOUNTS = path.join(__dirname, "out_finance_accounts.json");
const OUT_TXS = path.join(__dirname, "out_finance_txs.json");

function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (d) => rows.push(d))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function toDateOrNow(str) {
  if (!str) return new Date();
  const d = new Date(str);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

// mappe "Dépense" / "Revenu" -> "expense" / "income"
function mapTxType(src) {
  if (!src) return "expense";
  const v = src.toString().trim().toLowerCase();
  if (v.startsWith("rev")) return "income"; // Revenu
  return "expense"; // Dépense ou autre
}

// mappe "Fixe" / "Mensuel"
function mapRecurrence(src) {
  if (!src) return "fixe";
  const v = src.toString().trim().toLowerCase();
  if (v.startsWith("mens")) return "mensuel";
  return "fixe";
}

// mappe le detail si jamais c'est rempli
function mapDetail(src) {
  if (!src) return "autre";
  const v = src.toString().trim().toLowerCase();
  const allowed = [
    "epargne",
    "assurance",
    "retrait",
    "dette",
    "investissement",
    "autre",
  ];
  // si le CSV a écrit "Investissement" → on le normalise
  const normalized = v
    .replace("é", "e")
    .replace("è", "e")
    .replace("ê", "e")
    .replace(/\s+/g, " ");
  if (allowed.includes(v)) return v;
  if (allowed.includes(normalized)) return normalized;
  return "autre";
}

async function run() {
  const accountsCsv = await readCsv(CSV_ACCOUNTS);
  const txsCsv = await readCsv(CSV_TXS);

  // 1) comptes
  const accountsJson = accountsCsv.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);

    return {
      // on garde wp user_id POUR L'INSTANT
      user: wpUserId,
      name:
        row.account_name && row.account_name.trim() !== ""
          ? row.account_name.trim()
          : "Compte",
      currency:
        row.currency && row.currency.trim() !== ""
          ? row.currency.trim().toUpperCase()
          : "XOF", // tu peux mettre USD si tu préfères
      initial: row.initial_balance ? Number(row.initial_balance) : 0,
      description: row.description ? row.description : "",
      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.created_at),
      legacy: {
        sqlTable: "wp_finance_accounts",
        sqlId,
        account_type: row.account_type || "",
      },
    };
  });

  // 2) transactions
  const txsJson = txsCsv.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);
    const accountSqlId = Number(row.account_id);

    return {
      // on garde les IDs WP / SQL pour la 2e passe
      user: wpUserId,
      account: accountSqlId,
      type: mapTxType(row.transaction_type),
      amount: row.montant ? Number(row.montant) : 0,
      date: row.date_transaction
        ? toDateOrNow(row.date_transaction)
        : toDateOrNow(row.created_at),
      recurrence: mapRecurrence(row.recurrence),
      detail: mapDetail(row.detail),
      comment: row.description ? row.description : "",
      parentId: null,
      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.updated_at || row.created_at),
      legacy: {
        sqlTable: "wp_finance_transactions",
        sqlId,
        lastDuplicatedAt: row.last_duplicated_at || null,
      },
    };
  });

  fs.writeFileSync(OUT_ACCOUNTS, JSON.stringify(accountsJson, null, 2), "utf8");
  fs.writeFileSync(OUT_TXS, JSON.stringify(txsJson, null, 2), "utf8");

  console.log("✅ Comptes finance →", OUT_ACCOUNTS);
  console.log("✅ Transactions finance →", OUT_TXS);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
