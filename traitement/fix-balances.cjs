// fix-balances.cjs
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// 1️⃣ Configuration de l'environnement
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

const backendCfg = require(
  path.join(__dirname, "backend", "src", "config", "env.js"),
);
const MONGO_URI = backendCfg.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI est vide.");
  process.exit(1);
}

// 2️⃣ Imports des modèles
const User = require(
  path.join(__dirname, "backend", "src", "models", "user.model.js"),
);
const SellerPayout = require(
  path.join(__dirname, "backend", "src", "models", "sellerPayout.model.js"),
);
const CoursePayout = require(
  path.join(__dirname, "backend", "src", "models", "coursePayout.model.js"),
);
const AffiliationCommission = require(
  path.join(
    __dirname,
    "backend",
    "src",
    "models",
    "affiliationCommission.model.js",
  ),
);

const money = (val) => Number(Number(val || 0).toFixed(2));

async function run() {
  try {
    console.log("🔗 Connexion à MongoDB...");

    // On désactive le buffering global pour voir l'erreur immédiatement au lieu d'attendre 10s
    mongoose.set("bufferCommands", false);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ Connecté avec succès.");

    console.log("🔍 Recherche des utilisateurs...");
    // On utilise .lean() pour accélérer et éviter les soucis de proxy Mongoose
    const users = await User.find({})
      .select("_id email sellerBalance communityBalance affiliationBalance")
      .lean()
      .exec();

    console.log(
      `📦 ${users.length} utilisateurs trouvés. Calcul des soldes...`,
    );

    let updatedCount = 0;

    for (const user of users) {
      const uid = user._id;

      // --- A. Marketplace ---
      const sellerPayouts = await SellerPayout.aggregate([
        { $match: { seller: uid, status: "available" } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } },
      ]).exec();
      const realSeller = sellerPayouts[0]?.total || 0;

      // --- B. Formations ---
      const coursePayouts = await CoursePayout.aggregate([
        { $match: { seller: uid, status: "available" } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } },
      ]).exec();
      const realCommunity = coursePayouts[0]?.total || 0;

      // --- C. Affiliation ---
      const affComms = await AffiliationCommission.aggregate([
        { $match: { referrerId: uid, status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalCents: { $sum: "$amount" } } },
      ]).exec();
      const realAffiliation = (affComms[0]?.totalCents || 0) / 100;

      // --- D. Correction ---
      const needsUpdate =
        Math.abs(money(user.sellerBalance) - money(realSeller)) > 0.01 ||
        Math.abs(money(user.communityBalance) - money(realCommunity)) > 0.01 ||
        Math.abs(money(user.affiliationBalance) - money(realAffiliation)) >
          0.01;

      if (needsUpdate) {
        console.log(`⚠️ Mise à jour pour ${user.email} :`);
        console.log(
          `   - Boutique : ${user.sellerBalance || 0} -> ${money(realSeller)}$`,
        );
        console.log(
          `   - Commu    : ${user.communityBalance || 0} -> ${money(realCommunity)}$`,
        );
        console.log(
          `   - Affil    : ${user.affiliationBalance || 0} -> ${money(realAffiliation)}$`,
        );

        await User.updateOne(
          { _id: uid },
          {
            $set: {
              sellerBalance: money(realSeller),
              communityBalance: money(realCommunity),
              affiliationBalance: money(realAffiliation),
            },
          },
        ).exec();
        updatedCount++;
      }
    }

    console.log("------------------------------------------------");
    console.log(
      `✅ Opération terminée. ${updatedCount} utilisateurs synchronisés.`,
    );
  } catch (e) {
    console.error("❌ Erreur critique :", e.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Déconnecté.");
    }
    process.exit(0);
  }
}

run();
