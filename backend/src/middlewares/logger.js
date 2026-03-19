// backend/src/middlewares/logger.js
const morgan = require("morgan");
const { NODE_ENV } = require("../config/env");

// Création d'un token personnalisé pour morgan
morgan.token("source-flag", (req) => {
  return req.isMobile ? "📱 [APP MOBILE]" : "🌐 [WEB]";
});

function applyLogger(app) {
  if (NODE_ENV !== "production") {
    // Affiche la provenance avant la requête classique
    app.use(morgan(":source-flag :method :url :status :response-time ms - :res[content-length]"));
  }
}

module.exports = { applyLogger };