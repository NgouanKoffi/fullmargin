// grant-fmmetrix.cjs
// Active manuellement FM Metrix pour une liste d'emails

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// 1️⃣ charger le .env du backend
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// 2️⃣ on RÉUTILISE le mongoose du backend (très important)
const mongoose = require(path.join(
  __dirname,
  "backend",
  "node_modules",
  "mongoose"
));

// 3️⃣ charger la config backend
const backendCfg = require(path.join(
  __dirname,
  "backend",
  "src",
  "config",
  "env.js"
));
const MONGO_URI = backendCfg.MONGO_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "❌ MONGO_URI est vide. Vérifie backend/.env ou backend/src/config/env.js"
  );
  process.exit(1);
}

// 4️⃣ importer les modèles DU BACKEND (qui utilisent le même mongoose)
const User = require(path.join(
  __dirname,
  "backend",
  "src",
  "models",
  "user.model.js"
));
const FmMetrix = require(path.join(
  __dirname,
  "backend",
  "src",
  "models",
  "fmmetrix.model.js"
));
const FmMetrixSubscription = require(path.join(
  __dirname,
  "backend",
  "src",
  "models",
  "fmmetrixSubscription.model.js"
));

// 5️⃣ les emails à activer
const EMAILS = ["alissson909@gmail.com", "Professeurforex04@gmail.com"];

function makePeriod() {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  return { start: now, end };
}

async function run() {
  console.log("🔗 Connexion à", MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connecté");

  const { start: periodStart, end: periodEnd } = makePeriod();

  for (const email of EMAILS) {
    const norm = String(email).trim().toLowerCase();

    // 👉 là ça va utiliser le même mongoose que les modèles
    const user = await User.findOne({ email: norm }).lean();

    if (!user) {
      console.log(`❌ Utilisateur introuvable pour ${email}`);
      continue;
    }

    const userId = user._id;
    console.log(`➡️ Traitement de ${email} (id=${userId})`);

    // fmmetrices (état courant)
    await FmMetrix.findOneAndUpdate(
      { userId },
      {
        userId,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        startedAt: periodStart,
        validUntil: periodEnd,
        raw: { source: "manual-grant", by: "grant-fmmetrix.cjs" },
      },
      { upsert: true }
    );

    // historique
    await FmMetrixSubscription.create({
      userId,
      status: "active",
      periodStart,
      periodEnd,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSessionId: null,
      raw: { source: "manual-grant", by: "grant-fmmetrix.cjs" },
    });

    console.log(
      `✅ Abonnement FM Metrix donné à ${email} jusqu'au ${periodEnd.toISOString()}`
    );
  }

  await mongoose.disconnect();
  console.log("✅ Terminé.");
}

run().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
