// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\discussion\attachments.routes.js
const { cloudinary } = require("../../../utils/storage");

/**
 * Ici on gère les pièces jointes de discussion.
 * 👉 /pdf/base64 : pour l’AFFICHAGE dans le viewer (aucun download navigateur)
 * 👉 /download   : pour forcer le téléchargement (bouton "Télécharger")
 */
module.exports = (router) => {
  // ========= VIEWER : PDF -> BASE64 (pour le front) =========
  /**
   * GET /api/communaute/discussions/attachments/:publicId/pdf/base64
   * → { ok: true, data: "<base64>" }
   */
  router.get("/attachments/:publicId/pdf/base64", async (req, res) => {
    try {
      const rawId = decodeURIComponent(req.params.publicId || "").trim();
      if (!rawId) {
        return res.status(400).json({ ok: false, error: "publicId manquant." });
      }

      // URL Cloudinary SANS fl_attachment (juste le fichier brut)
      const url = cloudinary.url(rawId, {
        resource_type: "raw",
        secure: true,
        sign_url: true,
      });

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(500).json({
          ok: false,
          error: `Erreur Cloudinary (${response.status})`,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return res.json({ ok: true, data: base64 });
    } catch (err) {
      console.error("[attachments.pdf.base64] Erreur récupération PDF :", err);
      return res
        .status(500)
        .json({ ok: false, error: "Erreur lors du chargement du document." });
    }
  });

  // ========= DOWNLOAD : vrai téléchargement (bouton dédié) =========
  /**
   * GET /api/communaute/discussions/attachments/:publicId/download?name=NomOriginal.pdf
   * -> redirige vers une URL Cloudinary signée avec un vrai nom de fichier .pdf
   */
  router.get("/attachments/:publicId/download", async (req, res) => {
    try {
      const rawId = decodeURIComponent(req.params.publicId || "").trim();
      if (!rawId) {
        return res.status(400).json({ ok: false, error: "publicId manquant." });
      }

      const qName = (req.query.name || "").toString().trim();

      const url = cloudinary.url(rawId, {
        resource_type: "raw",
        secure: true,
        sign_url: true,
        flags: "attachment", // 👉 ICI SEULEMENT on force le téléchargement
        filename_override: qName || undefined,
      });

      return res.redirect(url);
    } catch (err) {
      console.error("[attachments.download] Erreur génération URL :", err);
      return res
        .status(500)
        .json({ ok: false, error: "Erreur lors de la génération du lien." });
    }
  });
};
