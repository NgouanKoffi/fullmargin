// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\auth\profile.js
const express = require("express");

const User = require("../../models/user.model");
const ProfileExtra = require("../../models/profileExtra.model");
const { ok, fail, verifyAuthHeader } = require("./_helpers");

const router = express.Router();

/* --------- petites validations --------- */
const isE164 = (s = "") => s === "" || /^\+[1-9]\d{5,20}$/.test(s); // +22501020304
const isISO2 = (s = "") => s === "" || /^[A-Z]{2}$/.test(s); // CI, FR...
const clampStr = (v, max) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

/* ============ GET /api/auth/profile/extra ============ */
/** Retourne les infos combinées User + ProfileExtra pour préremplir le formulaire. */
router.get("/extra", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Compte introuvable", 404);

    const extra = (await ProfileExtra.findOne({ user: userId }).lean()) || {};

    return ok(res, {
      profile: {
        fullName: extra.fullName || user.fullName || "",
        email: user.email || "",
        phone: extra.phone || "",
        country: (extra.country || "").toUpperCase(),
        city: extra.city || "",
        bio: extra.bio || "",
        avatarUrl: user.avatarUrl || "",
        coverUrl: user.coverUrl || "",
      },
    });
  } catch (e) {
    console.error("[GET /auth/profile/extra]", e?.message || e);
    return fail(res, "Chargement impossible");
  }
});

/* ============ GET /api/auth/profile/extra/public/:id ============ */
/** Version publique (lecture seule) pour afficher le profil d’un propriétaire par son userId. */
router.get("/extra/public/:id", async (req, res) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!userId) return fail(res, "ID requis", 400);

    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Compte introuvable", 404);

    const extra = (await ProfileExtra.findOne({ user: userId }).lean()) || {};

    return ok(res, {
      profile: {
        fullName: extra.fullName || user.fullName || "",
        // email reste exposé comme avant
        email: user.email || "",
        phone: extra.phone || "",
        country: (extra.country || "").toUpperCase(),
        city: extra.city || "",
        bio: extra.bio || "",
        // si tu veux un jour afficher l’avatar public, tu pourras ajouter:
        // avatarUrl: user.avatarUrl || "",
        // coverUrl: user.coverUrl || "",
      },
    });
  } catch (e) {
    console.error("[GET /auth/profile/extra/public/:id]", e?.message || e);
    return fail(res, "Lecture impossible");
  }
});

/* ============ PATCH /api/auth/profile/extra ============ */
router.patch("/extra", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const body = req.body || {};
    let { fullName, phone, country, city, bio } = body;

    // Normalisation / validations
    fullName = clampStr(fullName, 120);
    if (fullName && fullName.length < 2) {
      return fail(res, "Nom trop court (min. 2 caractères)");
    }

    phone = clampStr(phone, 24);
    if (!isE164(phone)) {
      return fail(res, "Téléphone invalide (format +XXXXXXXX)");
    }

    country = clampStr((country || "").toUpperCase(), 2);
    if (!isISO2(country)) {
      return fail(res, "Code pays invalide (ISO2)");
    }

    city = clampStr(city, 120);
    bio = clampStr(bio, 1000);

    // MAJ User (fullName)
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return fail(res, "Compte introuvable", 404);

    if (fullName) user.fullName = fullName;
    await user.save();

    // Upsert ProfileExtra
    let extra = await ProfileExtra.findOne({ user: userId });
    if (!extra) {
      extra = await ProfileExtra.create({
        user: userId,
        phone,
        country,
        city,
        bio,
        fullName,
      });
    } else {
      extra.phone = phone;
      extra.country = country;
      extra.city = city;
      extra.bio = bio;
      if (fullName) extra.fullName = fullName;
      await extra.save();
    }

    return ok(res, {
      profile: {
        fullName: extra.fullName || user.fullName || "",
        email: user.email || "",
        phone: extra.phone || "",
        country: extra.country || "",
        city: extra.city || "",
        bio: extra.bio || "",
        avatarUrl: user.avatarUrl || "",
        coverUrl: user.coverUrl || "",
      },
    });
  } catch (e) {
    console.error("[PATCH /auth/profile/extra]", e?.message || e);
    return fail(res, "Sauvegarde impossible");
  }
});

module.exports = router;
