// sync-journal-all.cjs
// Orchestrateur COMPLET pour la partie JOURNAL :
// - comptes de journal
// - marchés
// - stratégies
// - journaux (journalentries)

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

console.log(
  "🚀 Début du pipeline JOURNAL (comptes, marchés, stratégies, journaux)…"
);

// 1️⃣ Convertir les comptes de journal depuis le CSV
run("node convert_wp_journal_csv.cjs");

// 2️⃣ Convertir les marchés
run("node convert_marches.cjs");

// 3️⃣ Convertir les stratégies
run("node convert_strategies.cjs");

// 4️⃣ Synchroniser journalaccounts + markets + strategies dans Mongo
//     et générer les maps nécessaires (wpJournalId_to_mongoId.json, etc.)
run("node sync-journal-refs.cjs");

// 5️⃣ Convertir les journaux (avec IDs WP pour comptes/marchés/stratégies)
run("node convert_journaux.cjs");

// 6️⃣ Remplacer les IDs WP par les vrais _id Mongo dans les journaux
run("node link_journaux_with_mongo_ids.cjs");

// 7️⃣ Pousser dans la collection journalentries
run("node sync-journal-entries.cjs");

console.log("🎉 Pipeline JOURNAL terminé sans erreur.");
console.log("   Collections impactées :");
console.log("   - journalaccounts");
console.log("   - markets");
console.log("   - strategies");
console.log("   - journalentries");
console.log("   Les autres collections ne sont PAS touchées.");
