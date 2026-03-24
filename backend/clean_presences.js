require("dotenv").config();
const mongoose = require("mongoose");
const PresenceSession = require("./src/models/presenceSession.model");

async function run() {
  try {
    const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!uri) throw new Error("MONGO_URI invalide ou introuvable.");

    await mongoose.connect(uri);
    console.log("Connecté à MongoDB.");
    
    const countBefore = await PresenceSession.countDocuments();
    console.log(`Sessions totales (avant purge): ${countBefore}`);

    // Suppression des sessions vieilles de plus de 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result1 = await PresenceSession.deleteMany({ startedAt: { $lt: thirtyDaysAgo } });
    console.log(`Sessions > 30 jours supprimées: ${result1.deletedCount}`);

    // Suppression des sessions fantômes qui ont duré moins de 60 secondes (onglets bouncers)
    const result2 = await PresenceSession.deleteMany({ durationMs: { $lt: 60000 } });
    console.log(`Sessions fantômes (< 60s) supprimées: ${result2.deletedCount}`);

    const countAfter = await PresenceSession.countDocuments();
    console.log(`Sessions restantes : ${countAfter}`);
    
    console.log("Nettoyage terminé avec succès 🎉.");
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
  } finally {
    process.exit(0);
  }
}

run();
