// sync-finance-all.cjs
// Orchestrateur : convert + sync des COMPTES & TRANSACTIONS FINANCE
// ⚠️ Ne touche qu'aux collections : financeaccounts & financetxes

const { execSync } = require("child_process");

function run(cmd) {
  console.log("====================================================");
  console.log("▶️  RUN :", cmd);
  console.log("====================================================");
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log("✅ OK :", cmd);
  } catch (err) {
    console.error("❌ ERREUR pendant :", cmd);
    console.error(err.message || err);
    process.exit(1);
  }
}

console.log("🚀 Début du pipeline FINANCE (comptes + transactions)...");

// 1️⃣ Convertir les comptes finance depuis le CSV
run("node convert_finance_accounts.cjs");

// 2️⃣ Sync des comptes vers MongoDB + génération du mapping
//     -> financeaccounts
//     -> wpFinanceAccountId_to_mongoId.json
run("node sync-finance-accounts.cjs");

// 3️⃣ Convertir les transactions finance depuis le CSV
//     (utilise wpId_to_mongoId.json + wpFinanceAccountId_to_mongoId.json)
run("node convert_finance_tx.cjs");

// 4️⃣ Sync des transactions vers MongoDB
//     -> financetxes
run("node sync-finance-tx.cjs");

console.log("🎉 Pipeline FINANCE terminé sans erreur.");
console.log("   - Collections impactées : financeaccounts, financetxes");
console.log("   - financeprefs n'a PAS été modifiée.");
