// convert-journal-csv.cjs
// Lit tes 4 CSV :
//  - wp_compte_journal.csv
//  - wp_marches.csv
//  - wp_strategies.csv
//  - wp_journaux.csv
// et sort 4 JSON déjà structurés comme tes modèles Mongoose,
// MAIS en conservant les user_id (WP) et les id SQL pour la 2e passe.

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// 1. on cherche les csv à ces 3 endroits
function resolveCsv(name) {
  const candidates = [
    path.join(__dirname, name),
    path.join(__dirname, "backend", name),
    path.join(__dirname, "backend", "exports", name),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Fichier introuvable : " + name);
}

// tes fichiers
const CSV_JA = resolveCsv("wp_compte_journal.csv");
const CSV_MK = resolveCsv("wp_marches.csv");
const CSV_ST = resolveCsv("wp_strategies.csv");
const CSV_JE = resolveCsv("wp_journaux.csv");

// sorties
const OUT_JA = path.join(__dirname, "out_journal_accounts.json");
const OUT_MK = path.join(__dirname, "out_journal_markets.json");
const OUT_ST = path.join(__dirname, "out_journal_strategies.json");
const OUT_JE = path.join(__dirname, "out_journal_entries.json");

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

// petite normalisation pour "respect_strategie"
function normalizeRespect(v) {
  if (!v) return "";
  const lower = v.toString().trim().toLowerCase();
  if (lower === "oui" || lower === "yes") return "Oui";
  if (lower === "non" || lower === "no") return "Non";
  return "";
}

async function run() {
  console.log("📥 lecture CSV…");
  const [jaRows, mkRows, stRows, jeRows] = await Promise.all([
    readCsv(CSV_JA),
    readCsv(CSV_MK),
    readCsv(CSV_ST),
    readCsv(CSV_JE),
  ]);

  // 1) wp_compte_journal.csv → JournalAccount
  // id,user_id,account_name,currency,initial_balance,description,account_type,created_at
  const jaJson = jaRows.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);

    return {
      user: wpUserId, // on garde le wpId, ton modèle attend String mais on convertira après
      name:
        row.account_name && row.account_name.trim() !== ""
          ? row.account_name.trim()
          : "Compte",
      currency:
        row.currency && row.currency.trim() !== ""
          ? row.currency.trim().toUpperCase()
          : "USD",
      initial: row.initial_balance ? Number(row.initial_balance) : 0,
      description: row.description ? row.description : "",
      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.created_at),
      legacy: {
        sqlTable: "wp_compte_journal",
        sqlId,
      },
    };
  });

  // 2) wp_marches.csv → Market
  // id,user_id,marche_name,created_at
  const mkJson = mkRows.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);

    return {
      user: wpUserId,
      name:
        row.marche_name && row.marche_name.trim() !== ""
          ? row.marche_name.trim()
          : "Marché",
      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.created_at),
      legacy: {
        sqlTable: "wp_marches",
        sqlId,
      },
    };
  });

  // 3) wp_strategies.csv → Strategy
  // id,user_id,strategie_name,description,created_at
  const stJson = stRows.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);

    return {
      user: wpUserId,
      name:
        row.strategie_name && row.strategie_name.trim() !== ""
          ? row.strategie_name.trim()
          : "Stratégie",
      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.created_at),
      // ton modèle n'a pas description donc on le garde en legacy
      legacy: {
        sqlTable: "wp_strategies",
        sqlId,
        description: row.description || "",
      },
    };
  });

  // 4) wp_journaux.csv → JournalEntry
  // id,user_id,account_id,montant_investi,marche_id,strategie_id,ordre,total_lot,resultat,commentaire,detail,resultat_devise,created_at,date,image,respect_strategie,duree
  const jeJson = jeRows.map((row) => {
    const sqlId = Number(row.id);
    const wpUserId = Number(row.user_id);

    return {
      user: wpUserId,

      // références (on garde juste les ids SQL pour l'instant)
      accountId: row.account_id ? String(row.account_id) : "",
      accountName: "", // on pourra le remplir lors de la 2e passe si tu veux
      marketId: row.marche_id ? String(row.marche_id) : "",
      marketName: "",
      strategyId: row.strategie_id ? String(row.strategie_id) : "",
      strategyName: "",

      // champs métier
      order: row.ordre ? row.ordre : "", // "Buy" / "Sell"
      lot: row.total_lot ? row.total_lot.toString() : "",
      result: row.resultat ? row.resultat : "", // "Gain" / "Perte" / ...
      detail: row.detail ? row.detail : "",
      invested: row.montant_investi ? row.montant_investi.toString() : "",
      resultMoney: row.resultat_devise ? row.resultat_devise.toString() : "",
      resultPct: "",

      respect: normalizeRespect(row.respect_strategie),
      duration: row.duree ? row.duree : "",

      timeframes: [],
      session: "",
      comment: row.commentaire ? row.commentaire : "",

      imageDataUrl: "",
      imageUrl: row.image ? row.image : "",
      images: [],

      date: row.date ? row.date : "",

      deletedAt: null,
      createdAt: toDateOrNow(row.created_at),
      updatedAt: toDateOrNow(row.created_at),

      legacy: {
        sqlTable: "wp_journaux",
        sqlId,
      },
    };
  });

  // écriture
  fs.writeFileSync(OUT_JA, JSON.stringify(jaJson, null, 2), "utf8");
  fs.writeFileSync(OUT_MK, JSON.stringify(mkJson, null, 2), "utf8");
  fs.writeFileSync(OUT_ST, JSON.stringify(stJson, null, 2), "utf8");
  fs.writeFileSync(OUT_JE, JSON.stringify(jeJson, null, 2), "utf8");

  console.log("✅ out_journal_accounts.json");
  console.log("✅ out_journal_markets.json");
  console.log("✅ out_journal_strategies.json");
  console.log("✅ out_journal_entries.json");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
