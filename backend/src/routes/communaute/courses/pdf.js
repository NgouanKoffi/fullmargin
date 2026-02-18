// backend/src/routes/communaute/courses/pdf.js
const { getAuth, isUserEnrolled, Course, User, doFetch } = require("./_shared");

async function canAccessCoursePdf(userId, course) {
  const isOwner = String(course.ownerId || "") === String(userId || "");
  let isAdmin = false;
  try {
    const me = await User.findById(userId).select({ roles: 1 }).lean();
    isAdmin = Array.isArray(me?.roles) && me.roles.includes("admin");
  } catch {}
  const enrolled = await isUserEnrolled(userId, course._id);
  return isOwner || isAdmin || enrolled;
}

function findPdfItem(course, itemId) {
  let itemUrl = "";
  let filename = "document.pdf";
  outer: for (const m of course.modules || []) {
    for (const l of m.lessons || []) {
      for (const it of l.items || []) {
        if (String(it.id) === String(itemId) && it.type === "pdf") {
          itemUrl = String(it.url || "");
          const base = (String(it.title || "").trim() || "document").replace(
            /\.(pdf|PDF)$/i,
            ""
          );
          filename = `${base}.pdf`;
          break outer;
        }
      }
    }
  }
  return { itemUrl, filename };
}

module.exports = (router) => {
  // ===== Route pour l'AFFICHAGE (base64 dans l'iframe) =====
  router.get("/:id/items/:itemId/pdf/base64", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const { id, itemId } = req.params;
      const course = await Course.findOne({ _id: id, deletedAt: null }).lean();
      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      const allowed = await canAccessCoursePdf(auth.userId, course);
      if (!allowed) {
        return res
          .status(403)
          .json({ ok: false, error: "Inscription requise" });
      }

      const { itemUrl, filename } = findPdfItem(course, itemId);
      if (!itemUrl) {
        return res.status(404).json({ ok: false, error: "PDF introuvable" });
      }

      const upstream = await doFetch(itemUrl, { method: "GET" });
      if (!upstream.ok) {
        return res
          .status(502)
          .json({ ok: false, error: "Lecture distante impossible" });
      }

      const ab = await upstream.arrayBuffer();
      const buf = Buffer.from(ab);
      const base64 = buf.toString("base64");
      const mime = upstream.headers.get("content-type") || "application/pdf";

      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");

      return res.json({ ok: true, filename, mime, data: base64 });
    } catch (e) {
      console.error("[COURSES] pdf base64 error:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Erreur d'affichage PDF" });
    }
  });

  // ===== Route pour le TÉLÉCHARGEMENT explicite =====
  router.get("/:id/items/:itemId/pdf/file", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) return res.status(401).send("Non autorisé");

      // 🔒 On ne permet le téléchargement que si ?dl=1 est présent
      const isExplicitDownload = String(req.query.dl || "") === "1";
      if (!isExplicitDownload) {
        return res
          .status(400)
          .send("Paramètre dl=1 requis pour le téléchargement.");
      }

      const { id, itemId } = req.params;
      const course = await Course.findOne({ _id: id, deletedAt: null }).lean();
      if (!course) return res.status(404).send("Cours introuvable");

      const allowed = await canAccessCoursePdf(auth.userId, course);
      if (!allowed) return res.status(403).send("Inscription requise");

      const { itemUrl, filename } = findPdfItem(course, itemId);
      if (!itemUrl) return res.status(404).send("PDF introuvable");

      const upstream = await doFetch(itemUrl, { method: "GET" });
      if (!upstream.ok)
        return res.status(502).send("Lecture distante impossible");

      const ab = await upstream.arrayBuffer();
      const buf = Buffer.from(ab);
      const mime = upstream.headers.get("content-type") || "application/pdf";

      // inline=1 → ouverture dans un onglet, sinon fichier à télécharger
      const inline = String(req.query.inline || "") === "1";
      const dispoType = inline ? "inline" : "attachment";

      res.setHeader("Content-Type", mime);
      res.setHeader(
        "Content-Disposition",
        `${dispoType}; filename="${filename.replace(/"/g, "")}"`
      );
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.end(buf);
    } catch (e) {
      console.error("[COURSES] pdf file error:", e?.stack || e);
      return res.status(500).send("Erreur téléchargement PDF");
    }
  });
};
