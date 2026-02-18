// backend/src/routes/auth/login.js
const express = require("express");
const bcrypt = require("bcrypt");
const { verifyWordPressPassword } = require("../../utils/wpPassword");

const User = require("../../models/user.model");
const TempLogin = require("../../models/tempLogin.model");

const { gen6, hashCode, checkCode } = require("../../utils/code");
const { sendLoginCode } = require("../../utils/mailer");
const { sign } = require("../../utils/jwt");

const {
  ok,
  fail,
  LOGIN_TTL_SEC,
  normalizeEmail,
  maskEmail,
  parseExpMs,
  buildFrontendAuthSuccessUrl,
  recordLogin,
  computeSessionKinds,
} = require("./_helpers");

const router = express.Router();

/* ============ Login: REQUEST ============ */
router.post("/request", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return fail(res, "Champs manquants");

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail })
      .select("+passwordHash")
      .exec();

    if (!user) return fail(res, "Identifiants invalides");

    // 🚫 STRICT: local uniquement si localEnabled === true **ET** pas de googleId
    const isLocalAllowed = user.localEnabled === true && !user.googleId;
    if (!isLocalAllowed) {
      return fail(
        res,
        "Ce compte n’autorise pas la connexion par mot de passe.",
      );
    }

    if (!user.passwordHash) return fail(res, "Identifiants invalides");

    /* ========== 🔐 Vérification mot de passe ========== */
    let okPwd = false;

    if (
      user.passwordHash.startsWith("$2a$") ||
      user.passwordHash.startsWith("$2b$") ||
      user.passwordHash.startsWith("$2y$")
    ) {
      okPwd = await bcrypt.compare(password, user.passwordHash);
    } else if (
      user.passwordHash.startsWith("$P$") ||
      user.passwordHash.startsWith("$H$")
    ) {
      okPwd = verifyWordPressPassword(password, user.passwordHash);
      if (okPwd) {
        const newHash = await bcrypt.hash(password, 10);
        user.passwordHash = newHash;
        user.localEnabled = true;
        await user.save();
        console.log(`[MIGRATION] ${user.email} → bcrypt`);
      }
    }

    if (!okPwd) return fail(res, "Identifiants invalides");

    /* ==================== Suite normale ==================== */

    // ✅ CORRECTION ICI : On vérifie si la 2FA est activée sur le user
    const twoFAOn = user.twoFAEnabled === true;

    // Si PAS de 2FA => Connexion directe
    if (!twoFAOn) {
      const roles = user.roles || ["user"];
      const kinds = computeSessionKinds(roles);

      const token = sign({
        sub: String(user._id),
        email: user.email,
        roles,
        kinds,
      });
      const expiresAt =
        Date.now() + parseExpMs(process.env.JWT_EXPIRES_IN || "1h");

      await recordLogin(req, user, "password-no-2fa", true);

      const session = {
        token,
        expiresAt,
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl || "",
          roles,
          sessionKinds: kinds,
          googleLinked: !!user.googleId,
          localEnabled: user.localEnabled === true && !user.googleId,
          twoFAEnabled: false, // User connecté sans 2FA dans cette session
        },
      };

      const redirectUrl = buildFrontendAuthSuccessUrl(session);
      return ok(res, { session, redirectUrl });
    }

    // SI 2FA ACTIVÉE => On envoie le code et on demande validation
    const code = gen6();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + LOGIN_TTL_SEC * 1000);

    const temp = await TempLogin.create({
      user: user._id,
      email: user.email,
      codeHash,
      expiresAt,
      attempts: 0,
      resendCount: 0,
    });

    await sendLoginCode(user.email, code);

    return ok(res, {
      loginId: String(temp._id),
      masked: maskEmail(user.email),
      expiresInSec: LOGIN_TTL_SEC,
    });
  } catch (e) {
    console.error("/login/request:", e?.message || e);
    return fail(res, "Connexion impossible");
  }
});

/* ============ Login: VERIFY ============ */
router.post("/verify", async (req, res) => {
  try {
    const { loginId, code } = req.body || {};
    if (!loginId || !code) return fail(res, "Code ou identifiant manquant");

    const temp = await TempLogin.findById(loginId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if (temp.expiresAt < new Date()) {
      await TempLogin.findByIdAndDelete(loginId);
      return fail(res, "Code expiré. Veuillez recommencer la connexion.");
    }

    if (temp.attempts >= 5) {
      await TempLogin.findByIdAndDelete(loginId);
      return fail(
        res,
        "Trop de tentatives. Veuillez recommencer la connexion.",
      );
    }

    const match = await checkCode(String(code).trim(), temp.codeHash);
    if (!match) {
      temp.attempts++;
      await temp.save();
      return fail(res, "Code incorrect");
    }

    const user = await User.findById(temp.user).select("+passwordHash").exec();
    if (!user) {
      await TempLogin.findByIdAndDelete(loginId);
      return fail(res, "Compte introuvable");
    }

    // 🚫 STRICT: re-vérifier qu'on est bien en mode local-only
    if (!(user.localEnabled === true && !user.googleId)) {
      await TempLogin.findByIdAndDelete(loginId);
      return fail(
        res,
        "Ce compte n’autorise pas la connexion par mot de passe.",
      );
    }

    await TempLogin.findByIdAndDelete(loginId);

    const roles = user.roles || ["user"];
    const kinds = computeSessionKinds(roles);

    const token = sign({
      sub: String(user._id),
      email: user.email,
      roles,
      kinds,
    });
    const expiresAt =
      Date.now() + parseExpMs(process.env.JWT_EXPIRES_IN || "1h");

    await recordLogin(req, user, "password+email-otp", true);

    const session = {
      token,
      expiresAt,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        roles,
        sessionKinds: kinds,
        googleLinked: !!user.googleId,
        localEnabled: user.localEnabled === true && !user.googleId,
        twoFAEnabled: true, // Cette session a passé la 2FA
      },
    };

    const redirectUrl = buildFrontendAuthSuccessUrl(session);
    return ok(res, { session, redirectUrl });
  } catch (e) {
    console.error("❌ Erreur /login/verify:", e?.message || e);
    return fail(res, "Erreur lors de la vérification");
  }
});

/* ============ Login: RESEND ============ */
router.post("/resend", async (req, res) => {
  try {
    const { loginId } = req.body || {};
    if (!loginId) return fail(res, "Identifiant manquant");

    const temp = await TempLogin.findById(loginId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if ((temp.resendCount || 0) >= 1) {
      return fail(
        res,
        "Code déjà renvoyé une fois. Veuillez recommencer la connexion.",
      );
    }

    const newCode = gen6();
    temp.codeHash = await hashCode(newCode);
    temp.expiresAt = new Date(Date.now() + LOGIN_TTL_SEC * 1000);
    temp.lastSentAt = new Date();
    temp.resendCount = (temp.resendCount || 0) + 1;

    await temp.save();
    await sendLoginCode(temp.email, newCode);

    return ok(res, {
      masked: maskEmail(temp.email),
      expiresInSec: LOGIN_TTL_SEC,
    });
  } catch (e) {
    console.error("/login/resend:", e?.message || e);
    return fail(res, "Renvoi du code échoué");
  }
});

module.exports = router;
