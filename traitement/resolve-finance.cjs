// resolve-finance.cjs
// 2e passe : on prend les JSON intermédiaires + la map wpId->mongoId
// et on produit 2 JSON finaux propres (pas de user:null, pas de account:null évitable)

const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");

// fichiers d'entrée
const WP_MAP_FILE = path.join(__dirname, "wpId_to_mongoId.json");
const ACCOUNTS_IN = path.join(__dirname, "out_finance_accounts.json");
const TXS_IN = path.join(__dirname, "out_finance_txs.json");

// fichiers de sortie
const ACCOUNTS_OUT = path.join(__dirname, "final_finance_accounts.json");
const TXS_OUT = path.join(__dirname, "final_finance_txs.json");

function main() {
  const wpMap = JSON.parse(fs.readFileSync(WP_MAP_FILE, "utf8"));
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_IN, "utf8"));
  const txs = JSON.parse(fs.readFileSync(TXS_IN, "utf8"));

  // ancien id SQL de compte -> nouvel ObjectId
  const accountSqlIdToMongoId = {};

  // 1) comptes
  const resolvedAccounts = [];
  for (const acc of accounts) {
    const wpId = acc.user; // c'est encore le WP user_id (nombre)
    const mongoUserIdStr = wpMap[wpId];

    if (!mongoUserIdStr) {
      console.warn(
        "⛔ compte ignoré (user introuvable dans Mongo) wpId=",
        wpId,
        " sqlId=",
        acc.legacy && acc.legacy.sqlId
      );
      continue;
    }

    const newAccountId = new ObjectId();

    if (acc.legacy && typeof acc.legacy.sqlId === "number") {
      accountSqlIdToMongoId[acc.legacy.sqlId] = newAccountId;
    }

    resolvedAccounts.push({
      _id: newAccountId,
      user: new ObjectId(mongoUserIdStr),
      name: acc.name,
      currency: acc.currency,
      initial: acc.initial,
      description: acc.description,
      deletedAt: acc.deletedAt,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
      legacy: acc.legacy,
    });
  }

  // 2) transactions
  const resolvedTxs = [];
  for (const tx of txs) {
    const wpId = tx.user;
    const mongoUserIdStr = wpMap[wpId];

    if (!mongoUserIdStr) {
      console.warn(
        "⛔ transaction ignorée (user introuvable) wpId=",
        wpId,
        " txSqlId=",
        tx.legacy && tx.legacy.sqlId
      );
      continue;
    }

    const oldSqlAccountId = tx.account;
    const newAccountMongoId = accountSqlIdToMongoId[oldSqlAccountId];

    if (!newAccountMongoId) {
      console.warn(
        "⛔ transaction ignorée (compte finance introuvable) account_sql_id=",
        oldSqlAccountId,
        " txSqlId=",
        tx.legacy && tx.legacy.sqlId
      );
      continue;
    }

    resolvedTxs.push({
      user: new ObjectId(mongoUserIdStr),
      account: newAccountMongoId,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      recurrence: tx.recurrence,
      detail: tx.detail,
      comment: tx.comment,
      parentId: null,
      deletedAt: tx.deletedAt,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      legacy: tx.legacy,
    });
  }

  // 3) écrire
  fs.writeFileSync(
    ACCOUNTS_OUT,
    JSON.stringify(resolvedAccounts, null, 2),
    "utf8"
  );
  fs.writeFileSync(TXS_OUT, JSON.stringify(resolvedTxs, null, 2), "utf8");

  console.log("✅ Comptes résolus →", ACCOUNTS_OUT);
  console.log("✅ Transactions résolues →", TXS_OUT);
  console.log(
    "ℹ️ Comptes mappés depuis SQL → Mongo :",
    Object.keys(accountSqlIdToMongoId).length
  );
  console.log("ℹ️ Comptes retenus :", resolvedAccounts.length);
  console.log("ℹ️ Transactions retenues :", resolvedTxs.length);
}

main();
