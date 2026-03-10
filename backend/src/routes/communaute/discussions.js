// backend/src/routes/communaute/discussions.js
const express = require("express");
const router = express.Router();
const multer = require("multer"); // 👈 pour détecter les erreurs Multer

// Utils + modèles + middlewares communs
const common = require("./discussion/common");

// Sous-routes
const attachPrivateRoutes = require("./discussion/private.routes");
const attachGroupRoutes = require("./discussion/groups.routes");
const attachThreadsRoutes = require("./discussion/threads.routes");
const attachAttachmentsRoutes = require("./discussion/attachments.routes"); // 👈 NEW

// On monte toutes les sous-routes discussions
attachPrivateRoutes(router, common);
attachGroupRoutes(router, common);
attachThreadsRoutes(router, common);
attachAttachmentsRoutes(router); // 👈 très important : les routes /attachments/... sont de retour

// 👇👇👇 middleware global d'erreurs pour TOUTES les discussions
router.use((err, req, res, next) => {
  console.error(
    "[DISCUSSIONS] global error middleware:",
    err?.stack || err?.message || err
  );

  if (err instanceof multer.MulterError) {
    // Erreurs liées aux fichiers (taille, nombre, etc.)
    return res.status(400).json({
      ok: false,
      error: `Erreur de fichier: ${err.message}`,
    });
  }

  // Autres erreurs non catchées
  return res.status(500).json({
    ok: false,
    error: "Erreur serveur sur les discussions.",
  });
});

module.exports = router;
