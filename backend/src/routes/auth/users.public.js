// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\auth\users.public.js
const express = require("express");
const router = express.Router();

/* ⚠️ Ce fichier est dans routes/auth/,
   donc on remonte de deux niveaux pour models */
const User = require("../../models/user.model");
/* Helpers { ok, fail } situés dans le même dossier auth */
const { ok, fail } = require("./_helpers");

/**
 * GET /users/public/:id
 * Renvoie un profil public minimal (lecture seule) pour affichage propriétaire.
 */
router.get("/public/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return fail(res, "ID requis", 400);

    const u = await User.findById(id)
      .select({
        _id: 1,
        fullName: 1,
        email: 1, // (visible publiquement selon le choix produit)
        avatarUrl: 1,
        coverUrl: 1,
      })
      .lean();

    if (!u) return fail(res, "Introuvable", 404);

    return ok(res, {
      id: String(u._id),
      fullName: u.fullName || "",
      email: u.email || "",
      avatarUrl: u.avatarUrl || "",
      coverUrl: u.coverUrl || "",
    });
  } catch (e) {
    console.error("[GET /users/public/:id]", e?.message || e);
    return fail(res, "Lecture impossible");
  }
});

module.exports = router;
