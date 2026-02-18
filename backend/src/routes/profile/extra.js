// backend/src/routes/profile/extra.js
const express = require("express");
const router = express.Router();

const User = require("../../models/user.model");
const ProfileExtra = require("../../models/profileExtra.model");
const { ok, fail, verifyAuthHeader } = require("../auth/_helpers");
const { recordAudit } = require("../../utils/audit");

/* --- middleware d'auth (synchrone) --- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) return fail(res, "Non autorisé", 401);
    req.auth = { userId: a.userId };
    next();
  } catch {
    return fail(res, "Non autorisé", 401);
  }
}

/* --- util validations --- */
const isE164 = (s = "") => /^\+\d{6,15}$/.test(s);
const norm = (s) => String(s ?? "").trim();
const clamp = (s, n) => (s.length > n ? s.slice(0, n) : s);
const normCountry = (s) => {
  const v = norm(s).toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : "";
};

/**
 * GET /api/profile/extra
 * -> { ok, profile: { fullName, email, phone, country, city, bio, avatarUrl, coverUrl } }
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Utilisateur introuvable", 404);

    const extra = (await ProfileExtra.findOne({ user: userId }).lean()) || {};

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
    console.error("GET /profile/extra:", e?.message || e);
    return fail(res, "Chargement impossible");
  }
});

/**
 * PATCH /api/profile/extra
 */
router.patch("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { fullName, phone, country, city, bio } = req.body || {};

    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Utilisateur introuvable", 404);

    const prevExtra =
      (await ProfileExtra.findOne({ user: userId }).lean()) || {};

    const updatesExtra = {};
    const changes = []; // [{ field, from, to }]

    if (fullName !== undefined) {
      const v = clamp(norm(fullName), 120);
      const from = (prevExtra.fullName || user.fullName || "").trim();
      if (v !== from) changes.push({ field: "fullName", from, to: v });
      updatesExtra.fullName = v;
      await User.findByIdAndUpdate(userId, { $set: { fullName: v } }).exec();
    }

    if (phone !== undefined) {
      const v = norm(phone);
      if (v && !isE164(v)) {
        return fail(res, "Numéro de téléphone invalide (E.164 attendu)");
      }
      const from = prevExtra.phone || "";
      if (v !== from) changes.push({ field: "phone", from, to: v });
      updatesExtra.phone = v;
    }

    if (country !== undefined) {
      const v = normCountry(country);
      const from = prevExtra.country || "";
      if (v !== from) changes.push({ field: "country", from, to: v });
      updatesExtra.country = v;
    }

    if (city !== undefined) {
      const v = clamp(norm(city), 120);
      const from = prevExtra.city || "";
      if (v !== from) changes.push({ field: "city", from, to: v });
      updatesExtra.city = v;
    }

    if (bio !== undefined) {
      const v = clamp(norm(bio), 1000);
      const from = (prevExtra.bio || "").trim();
      if (v !== from) changes.push({ field: "bio", from, to: v });
      updatesExtra.bio = v;
    }

    const extra = await ProfileExtra.findOneAndUpdate(
      { user: userId },
      { $set: updatesExtra, $setOnInsert: { user: userId } },
      { new: true, upsert: true }
    ).lean();

    const freshUser = await User.findById(userId).lean();

    if (changes.length > 0) {
      const changed = Object.fromEntries(
        changes.map((c) => [c.field, { from: c.from, to: c.to }])
      );
      await recordAudit(req, userId, "profile.update", { changed });
    }

    return ok(res, {
      profile: {
        fullName: extra.fullName || freshUser.fullName || "",
        email: freshUser.email || "",
        phone: extra.phone || "",
        country: extra.country || "",
        city: extra.city || "",
        bio: extra.bio || "",
        avatarUrl: freshUser.avatarUrl || "",
        coverUrl: freshUser.coverUrl || "",
      },
    });
  } catch (e) {
    console.error("PATCH /profile/extra:", e?.message || e);
    return fail(res, "Sauvegarde impossible");
  }
});

module.exports = router;
