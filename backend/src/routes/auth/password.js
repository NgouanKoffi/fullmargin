// routes/auth/password.js
const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../../models/user.model");
const TempReset = require("../../models/tempReset.model");

const { gen6, hashCode, checkCode } = require("../../utils/code");
const { sendPasswordResetCode } = require("../../utils/mailer");
const { recordAudit } = require("../../utils/audit"); // ✅ unifié

const {
  ok,
  fail,
  normalizeEmail,
  maskEmail,
  verifyAuthHeader,
} = require("./_helpers");

const router = express.Router();

// TTL reset (ex: 10 min)
const RESET_TTL_SEC = parseInt(process.env.RESET_TTL_SEC || "600", 10);

/* ========= Helpers de validation de mot de passe ========= */
const hasLower = (s = "") => /[a-z]/.test(s);
const hasUpper = (s = "") => /[A-Z]/.test(s);
const hasDigit = (s = "") => /[0-9]/.test(s);
const hasSpecial = (s = "") => /[^A-Za-z0-9\s]/.test(s);
const hasNoSpace = (s = "") => !/\s/.test(s);

/**
 * Retourne null si OK, sinon un code d'erreur (pour que le front puisse mapper).
 * Codes possibles:
 *  - INVALID | TOO_SHORT | LOWER_REQUIRED | UPPER_REQUIRED | DIGIT_REQUIRED
 *  - SPECIAL_REQUIRED | SPACE_NOT_ALLOWED | SAME_AS_CURRENT
 */
function validateNewPassword(next, current) {
  if (!next || typeof next !== "string") return "INVALID";
  if (next.length < 8) return "TOO_SHORT";
  if (!hasLower(next)) return "LOWER_REQUIRED";
  if (!hasUpper(next)) return "UPPER_REQUIRED";
  if (!hasDigit(next)) return "DIGIT_REQUIRED";
  if (!hasSpecial(next)) return "SPECIAL_REQUIRED";
  if (!hasNoSpace(next)) return "SPACE_NOT_ALLOWED";
  if (current && next === current) return "SAME_AS_CURRENT";
  return null;
}

/* ========= DEMANDE DE RÉINITIALISATION ========= */
/**
 * POST /auth/password/request
 * body: { email }
 * response: { ok, resetId?, masked?, expiresInSec? }
 */
router.post("/request", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return fail(res, "Email manquant");

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash").exec();

    // Réponse "silencieuse" pour éviter l'énumération d'emails
    if (!user) {
      return ok(res, { sent: true });
    }

    // Si le compte est Google-only sans mot de passe local
    const isLocalAllowed =
      user.localEnabled === true || (user.localEnabled === undefined && !user.googleId);
    if (!isLocalAllowed) {
      return fail(res, "Ce compte utilise Google. Réinitialisation par mot de passe indisponible.");
    }

    const code = gen6();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + RESET_TTL_SEC * 1000);

    // Crée une demande de reset
    const temp = await TempReset.create({
      user: user._id,
      email: user.email,
      codeHash,
      expiresAt,
      attempts: 0,
      resendCount: 0,
    });

    // Envoi email
    await sendPasswordResetCode(user.email, code, Math.round(RESET_TTL_SEC / 60));

    // ✅ Audit
    await recordAudit(req, user._id, "password.reset.request");

    return ok(res, {
      resetId: String(temp._id),
      masked: maskEmail(user.email),
      expiresInSec: RESET_TTL_SEC,
    });
  } catch (e) {
    console.error("/password/request:", e?.message || e);
    return fail(res, "Impossible d'initier la réinitialisation");
  }
});

/* ========= RENVOI DU CODE ========= */
/**
 * POST /auth/password/resend
 * body: { resetId }
 */
router.post("/resend", async (req, res) => {
  try {
    const { resetId } = req.body || {};
    if (!resetId) return fail(res, "Identifiant manquant");

    const temp = await TempReset.findById(resetId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if ((temp.resendCount || 0) >= 1) {
      return fail(res, "Code déjà renvoyé une fois. Recommencez la procédure.");
    }

    const code = gen6();
    temp.codeHash = await hashCode(code);
    temp.expiresAt = new Date(Date.now() + RESET_TTL_SEC * 1000);
    temp.lastSentAt = new Date();
    temp.resendCount = (temp.resendCount || 0) + 1;

    await temp.save();
    await sendPasswordResetCode(temp.email, code, Math.round(RESET_TTL_SEC / 60));

    // ✅ Audit
    await recordAudit(req, temp.user, "password.reset.resend");

    return ok(res, {
      masked: maskEmail(temp.email),
      expiresInSec: RESET_TTL_SEC,
    });
  } catch (e) {
    console.error("/password/resend:", e?.message || e);
    return fail(res, "Renvoi du code échoué");
  }
});

/* ========= VÉRIFICATION + NOUVEAU MDP ========= */
/**
 * POST /auth/password/verify
 * body: { resetId, code, newPassword }
 */
router.post("/verify", async (req, res) => {
  try {
    const { resetId, code, newPassword } = req.body || {};
    if (!resetId || !code || !newPassword) {
      return fail(res, "Paramètres manquants");
    }

    const temp = await TempReset.findById(resetId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if (temp.expiresAt < new Date()) {
      await TempReset.findByIdAndDelete(resetId);
      return fail(res, "Code expiré. Veuillez recommencer.");
    }

    if ((temp.attempts || 0) >= 5) {
      await TempReset.findByIdAndDelete(resetId);
      return fail(res, "Trop de tentatives. Veuillez recommencer.");
    }

    const match = await checkCode(String(code).trim(), temp.codeHash);
    if (!match) {
      temp.attempts = (temp.attempts || 0) + 1;
      await temp.save();
      return fail(res, "Code incorrect");
    }

    const user = await User.findById(temp.user).select("+passwordHash").exec();
    if (!user) {
      await TempReset.findByIdAndDelete(resetId);
      return fail(res, "Compte introuvable");
    }

    // Validation du nouveau mot de passe
    const err = validateNewPassword(String(newPassword));
    if (err) return fail(res, err);

    // Met à jour le mot de passe
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    // Active le login local si besoin (utile pour un ancien compte Google-only)
    if (user.localEnabled !== true) user.localEnabled = true;
    // Optionnel: user.passwordChangedAt = new Date();
    await user.save();

    await TempReset.findByIdAndDelete(resetId);

    // ✅ Audit
    await recordAudit(req, user._id, "password.reset.verify");

    return ok(res, { done: true });
  } catch (e) {
    console.error("/password/verify:", e?.message || e);
    return fail(res, "Échec de la réinitialisation");
  }
});

/* ========= MISE À JOUR AUTHENTIFIÉE (profil) ========= */
/**
 * POST /auth/password/update
 * headers: Authorization: Bearer <token>
 * body: { currentPassword, newPassword }
 * response: { ok, updated: true }
 */
router.post("/update", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return fail(res, "Champs manquants");

    const user = await User.findById(userId).select("+passwordHash").exec();
    if (!user) return fail(res, "Compte introuvable");

    if (!user.passwordHash) return fail(res, "Mot de passe actuel absent");
    const okPwd = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!okPwd) return fail(res, "Mot de passe actuel incorrect");

    const err = validateNewPassword(String(newPassword), String(currentPassword));
    if (err) return fail(res, err);

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    if (user.localEnabled !== true) user.localEnabled = true;
    // Optionnel: user.passwordChangedAt = new Date();
    await user.save();

    // ✅ Audit
    await recordAudit(req, user._id, "password.change");

    return ok(res, { updated: true });
  } catch (e) {
    console.error("/password/update:", e?.message || e);
    return fail(res, "Mise à jour impossible");
  }
});

module.exports = router;