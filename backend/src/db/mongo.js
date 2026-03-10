// backend/src/db/mongo.js
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/env");

function connectMongo() {
  return mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Mongo connecté"))
    .catch((err) => {
      console.error("❌ Connexion Mongo échouée:", err.message);
      throw err;
    });
}

module.exports = { connectMongo };