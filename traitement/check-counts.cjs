// check-counts.cjs
const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://fullmarginnet:yPCU4PHWFHFVO7PF@fullmargin.c48zbsu.mongodb.net/fullmargin";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("fullmargin");

  const financeAccounts = await db
    .collection("financeaccounts")
    .countDocuments();
  const financeTx = await db.collection("financetxes").countDocuments();
  const journalAccounts = await db
    .collection("journalaccounts")
    .countDocuments();
  const journalEntries = await db.collection("journalentries").countDocuments();

  console.log("=== FINANCE ===");
  console.log("Accounts :", financeAccounts);
  console.log("Transactions :", financeTx);

  console.log("=== JOURNAL ===");
  console.log("Accounts :", journalAccounts);
  console.log("Entries  :", journalEntries);

  await client.close();
}

run().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
