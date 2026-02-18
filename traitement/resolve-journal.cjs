// resolve-journal.cjs
// 2e passe propre : on prend les 4 JSON intermédiaires + la map wpId->mongoId
// on génère de vrais _id pour accounts/markets/strategies
// et on NE GARDE PAS les lignes où le user n'existe pas
// et on NE GARDE PAS les journaux qui pointent vers un compte inexistant

const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");

const WP_MAP_FILE = path.join(__dirname, "wpId_to_mongoId.json");
const JA_IN = path.join(__dirname, "out_journal_accounts.json");
const MK_IN = path.join(__dirname, "out_journal_markets.json");
const ST_IN = path.join(__dirname, "out_journal_strategies.json");
const JE_IN = path.join(__dirname, "out_journal_entries.json");

const JA_OUT = path.join(__dirname, "final_journal_accounts.json");
const MK_OUT = path.join(__dirname, "final_journal_markets.json");
const ST_OUT = path.join(__dirname, "final_journal_strategies.json");
const JE_OUT = path.join(__dirname, "final_journal_entries.json");

function main() {
  const wpMap = JSON.parse(fs.readFileSync(WP_MAP_FILE, "utf8"));
  const jaArr = JSON.parse(fs.readFileSync(JA_IN, "utf8"));
  const mkArr = JSON.parse(fs.readFileSync(MK_IN, "utf8"));
  const stArr = JSON.parse(fs.readFileSync(ST_IN, "utf8"));
  const jeArr = JSON.parse(fs.readFileSync(JE_IN, "utf8"));

  const jaSqlToId = {};
  const mkSqlToId = {};
  const stSqlToId = {};

  // 1) journal accounts
  const jaFinal = [];
  for (const acc of jaArr) {
    const wpId = acc.user;
    const mongoUserIdStr = wpMap[wpId];
    if (!mongoUserIdStr) {
      console.warn("⛔ compte journal ignoré (user introuvable) wpId=", wpId);
      continue;
    }

    const newId = new ObjectId();
    if (acc.legacy && typeof acc.legacy.sqlId === "number") {
      jaSqlToId[acc.legacy.sqlId] = newId;
    }

    jaFinal.push({
      _id: newId,
      user: mongoUserIdStr, // modèle = String
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

  // 2) markets
  const mkFinal = [];
  for (const m of mkArr) {
    const wpId = m.user;
    const mongoUserIdStr = wpMap[wpId];
    if (!mongoUserIdStr) {
      console.warn("⛔ marché ignoré (user introuvable) wpId=", wpId);
      continue;
    }

    const newId = new ObjectId();
    if (m.legacy && typeof m.legacy.sqlId === "number") {
      mkSqlToId[m.legacy.sqlId] = newId;
    }

    mkFinal.push({
      _id: newId,
      user: mongoUserIdStr,
      name: m.name,
      deletedAt: m.deletedAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      legacy: m.legacy,
    });
  }

  // 3) strategies
  const stFinal = [];
  for (const s of stArr) {
    const wpId = s.user;
    const mongoUserIdStr = wpMap[wpId];
    if (!mongoUserIdStr) {
      console.warn("⛔ stratégie ignorée (user introuvable) wpId=", wpId);
      continue;
    }

    const newId = new ObjectId();
    if (s.legacy && typeof s.legacy.sqlId === "number") {
      stSqlToId[s.legacy.sqlId] = newId;
    }

    stFinal.push({
      _id: newId,
      user: mongoUserIdStr,
      name: s.name,
      deletedAt: s.deletedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      legacy: s.legacy,
    });
  }

  // 4) journal entries
  const jeFinal = [];
  for (const e of jeArr) {
    const wpId = e.user;
    const mongoUserIdStr = wpMap[wpId];
    if (!mongoUserIdStr) {
      console.warn("⛔ journal ignoré (user introuvable) wpId=", wpId);
      continue;
    }

    // compte obligatoire : on a un account_id dans le CSV, il doit exister
    let newAccountId = "";
    if (e.accountId) {
      const mapped = jaSqlToId[Number(e.accountId)];
      if (!mapped) {
        console.warn(
          "⛔ journal ignoré (compte introuvable) accountId=",
          e.accountId,
          " journal sqlId=",
          e.legacy && e.legacy.sqlId
        );
        continue;
      }
      newAccountId = mapped.toString();
    }

    // marché et stratégie → s'il n'y en a pas, on n'arrête pas tout
    let newMarketId = "";
    if (e.marketId) {
      const mapped = mkSqlToId[Number(e.marketId)];
      newMarketId = mapped ? mapped.toString() : "";
    }

    let newStrategyId = "";
    if (e.strategyId) {
      const mapped = stSqlToId[Number(e.strategyId)];
      newStrategyId = mapped ? mapped.toString() : "";
    }

    jeFinal.push({
      user: mongoUserIdStr,
      accountId: newAccountId,
      accountName: e.accountName,
      marketId: newMarketId,
      marketName: e.marketName,
      strategyId: newStrategyId,
      strategyName: e.strategyName,
      order: e.order,
      lot: e.lot,
      result: e.result,
      detail: e.detail,
      invested: e.invested,
      resultMoney: e.resultMoney,
      resultPct: e.resultPct,
      respect: e.respect,
      duration: e.duration,
      timeframes: e.timeframes,
      session: e.session,
      comment: e.comment,
      imageDataUrl: e.imageDataUrl,
      imageUrl: e.imageUrl,
      images: e.images,
      date: e.date,
      deletedAt: e.deletedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      legacy: e.legacy,
    });
  }

  fs.writeFileSync(JA_OUT, JSON.stringify(jaFinal, null, 2), "utf8");
  fs.writeFileSync(MK_OUT, JSON.stringify(mkFinal, null, 2), "utf8");
  fs.writeFileSync(ST_OUT, JSON.stringify(stFinal, null, 2), "utf8");
  fs.writeFileSync(JE_OUT, JSON.stringify(jeFinal, null, 2), "utf8");

  console.log("✅ final_journal_accounts.json (", jaFinal.length, ")");
  console.log("✅ final_journal_markets.json (", mkFinal.length, ")");
  console.log("✅ final_journal_strategies.json (", stFinal.length, ")");
  console.log("✅ final_journal_entries.json (", jeFinal.length, ")");
}

main();
