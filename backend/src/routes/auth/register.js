// routes/auth/register.js
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../../models/user.model");
const TempRegister = require("../../models/tempRegister.model");

const { gen6, hashCode, checkCode } = require("../../utils/code");
const { sendLoginCode, sendWelcomeEmail } = require("../../utils/mailer");
const { sign } = require("../../utils/jwt");

const {
  ok,
  fail,
  REGISTER_TTL_SEC,
  normalizeEmail,
  maskEmail,
  parseExpMs,
  buildFrontendAuthSuccessUrl,
} = require("./_helpers");

// 👇 ajout pour l’unification analytics
const AnalyticsIdentity = require("../../analytics/identity.model");
const { getClientIp, hashIp } = require("../../analytics/helpers");

const router = express.Router();

/* -----------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */
function normalizeReferralCode(raw) {
  if (!raw) return "";
  // Garde A-Z 0-9 _ - ; upper pour uniformiser
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

// Récupère un visitorId éventuel depuis le body ou un header
function pickVisitorId(req) {
  const h = req.headers || {};
  // tolère plusieurs variantes côté client
  const fromHeader =
    h["x-visitor-id"] ||
    h["x-visitorid"] ||
    h["x_fm_visitor_id"] ||
    h["x-fm-visitor-id"];
  return (
    (req.body && req.body.visitorId) ||
    (typeof fromHeader === "string" ? fromHeader : "")
  );
}

/* ============ Register: REQUEST ============ */
router.post("/request", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      referralCode: rawReferral,
    } = req.body || {};
    if (!fullName || !email || !password) return fail(res, "Champs manquants");

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return fail(res, "Un compte avec cet email existe déjà");

    // 🔗 Referral (optionnel)
    const referralCode = normalizeReferralCode(rawReferral);
    let referralIsValid = false;
    if (referralCode) {
      const sponsor = await User.findOne({ referralCode }).select("_id").lean();
      referralIsValid = !!sponsor;
      // Pour un comportement strict, tu peux refuser si invalide.
    }

    const regId = crypto.randomUUID();
    const code = gen6();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + REGISTER_TTL_SEC * 1000);

    await TempRegister.create({
      _id: regId,
      email: normalizedEmail,
      fullName,
      passwordHash: await bcrypt.hash(password, 10),
      codeHash,
      expiresAt,
      attempts: 0,
      resendCount: 0,
      // stocke le code referral pour /verify
      referralCode: referralIsValid ? referralCode : undefined,
    });

    await sendLoginCode(normalizedEmail, code);

    return ok(res, {
      regId,
      email: normalizedEmail,
      masked: maskEmail(normalizedEmail),
      expiresInSec: REGISTER_TTL_SEC,
    });
  } catch (e) {
    console.error("/register/request:", e?.message || e);
    return fail(res, "Création échouée");
  }
});

/* ============ Register: VERIFY ============ */
router.post("/verify", async (req, res) => {
  try {
    const { regId, code } = req.body || {};
    if (!regId || !code) return fail(res, "Code ou identifiant manquant");

    const temp = await TempRegister.findById(regId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if (temp.expiresAt < new Date()) {
      await TempRegister.findByIdAndDelete(regId);
      return fail(res, "Code expiré. Veuillez recommencer l'inscription.");
    }

    if (temp.attempts >= 5) {
      await TempRegister.findByIdAndDelete(regId);
      return fail(
        res,
        "Trop de tentatives. Veuillez recommencer l'inscription.",
      );
    }

    const match = await checkCode(String(code).trim(), temp.codeHash);
    if (!match) {
      temp.attempts++;
      await temp.save();
      return fail(res, "Code incorrect");
    }

    const existing = await User.findOne({ email: temp.email }).lean();
    if (existing) {
      await TempRegister.findByIdAndDelete(regId);
      return fail(res, "Un compte avec cet email existe déjà");
    }

    // 🔗 Résolution du parrain à partir du code stocké en /request (si présent)
    let referredBy = null;
    const storedReferral = normalizeReferralCode(temp.referralCode);
    if (storedReferral) {
      const sponsor = await User.findOne({ referralCode: storedReferral })
        .select("_id")
        .lean();
      if (sponsor) referredBy = sponsor._id;
    }

    const newUser = await User.create({
      email: temp.email,
      fullName: temp.fullName,
      passwordHash: temp.passwordHash,
      roles: ["user"],
      provider: "local", // ok si absent du schema
      localEnabled: true,
      twoFAEnabled: false, // ✅ Forcé à false à l'inscription
      referredBy,
    });

    await TempRegister.findByIdAndDelete(regId);

    // 🎉 email de bienvenue (non bloquant)
    sendWelcomeEmail(newUser.email, newUser.fullName).catch((e) =>
      console.error("[welcome] send failed:", e?.message || e),
    );

    // Session JWT
    const token = sign({
      sub: String(newUser._id),
      email: newUser.email,
      roles: newUser.roles,
    });
    const expiresAt =
      Date.now() + parseExpMs(process.env.JWT_EXPIRES_IN || "1h");

    const session = {
      token,
      expiresAt,
      user: {
        id: String(newUser._id),
        fullName: newUser.fullName,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl || "",
        roles: newUser.roles,
      },
    };

    // ✅ Unification analytics (si le front a fourni un visitorId)
    try {
      const visitorId = pickVisitorId(req);
      if (visitorId) {
        const ip = getClientIp(req);
        const ipHashVal = hashIp(ip);
        await AnalyticsIdentity.updateOne(
          { user: newUser._id, visitorId },
          {
            $setOnInsert: { firstSeenAt: new Date() },
            $set: {
              lastSeenAt: new Date(),
              ua: req.headers["user-agent"] || "",
              ipHash: ipHashVal,
            },
            $inc: { seen: 1 },
          },
          { upsert: true },
        );
      }
    } catch (e) {
      // non bloquant
      console.warn("[analytics identify] skipped:", e?.message || e);
    }

    const redirectUrl = buildFrontendAuthSuccessUrl(session);
    return ok(res, { session, redirectUrl });
  } catch (e) {
    console.error("❌ Erreur /register/verify:", e?.message || e);
    return fail(res, "Erreur lors de la vérification");
  }
});

/* ============ Register: RESEND ============ */
router.post("/resend", async (req, res) => {
  try {
    const { regId } = req.body || {};
    if (!regId) return fail(res, "Identifiant manquant");

    const temp = await TempRegister.findById(regId);
    if (!temp) return fail(res, "Lien expiré ou invalide");

    if ((temp.resendCount || 0) >= 1) {
      return fail(
        res,
        "Code déjà renvoyé une fois. Veuillez recommencer l'inscription.",
      );
    }

    const newCode = gen6();
    temp.codeHash = await hashCode(newCode);
    temp.expiresAt = new Date(Date.now() + REGISTER_TTL_SEC * 1000);
    temp.lastSentAt = new Date();
    temp.resendCount = (temp.resendCount || 0) + 1;

    await temp.save();
    await sendLoginCode(temp.email, newCode);

    return ok(res, {
      masked: maskEmail(temp.email),
      expiresInSec: REGISTER_TTL_SEC,
    });
  } catch (e) {
    console.error("/register/resend:", e?.message || e);
    return fail(res, "Renvoi du code échoué");
  }
});

module.exports = router;
