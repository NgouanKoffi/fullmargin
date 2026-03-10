// backend/src/routes/auth/google.js
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../../models/user.model");
const { uploadAvatarFromUrl } = require("../../utils/storage");
const { sign } = require("../../utils/jwt");
const { sendWelcomeEmail } = require("../../utils/mailer");

const {
  ok,
  fail,
  normalizeEmail,
  parseExpMs,
  buildFrontendBase,
  buildFrontendAuthSuccessUrl,
  recordLogin,
  verifyAuthHeader,
  computeSessionKinds,
} = require("./_helpers");

// 👇 mapping analytics visitorId <-> user
const AnalyticsIdentity = require("../../analytics/identity.model");
const { getClientIp, hashIp } = require("../../analytics/helpers");

const router = express.Router();

/* ============ Config durcie ============ */
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Base publique de l'API
 * - en prod → https://api.fullmargin.net (ou celle de l'env)
 * - en dev → localhost:5179
 */
const API_PUBLIC_BASE = (() => {
  const env = (process.env.API_PUBLIC_BASE || "").trim().replace(/\/$/, "");
  if (IS_PROD) return env || "https://api.fullmargin.net";
  return env || "http://localhost:5179";
})();

/**
 * Origine front autorisée / utilisée pour construire les redirections
 * On regarde dans l'ordre :
 * 1) FRONT_ORIGIN
 * 2) PUBLIC_WEB_BASE_URL
 * 3) VITE_PUBLIC_WEB_BASE (au cas où tu le passes à ton node via process.env)
 * 4) fallback prod → https://site.fullmargin.net
 * 5) fallback dev → http://localhost:5173
 */
const FRONT_ORIGIN = (() => {
  const env = (
    process.env.FRONT_ORIGIN ||
    process.env.PUBLIC_WEB_BASE_URL ||
    process.env.VITE_PUBLIC_WEB_BASE ||
    ""
  ).trim();
  if (IS_PROD) {
    // en prod on garde ton sous-domaine si rien n'est précisé
    return env || "https://site.fullmargin.net";
  }
  return env || "http://localhost:5173";
})();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * Choisit un redirect_uri fiable :
 * - en PROD : on ignore tout ce qui ressemble à “localhost” et on force l’URL publique
 * - en DEV : localhost
 */
function computeRedirectUri() {
  const envUri = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (IS_PROD) {
    if (envUri && !/^https?:\/\/localhost/i.test(envUri)) return envUri;
    return `${API_PUBLIC_BASE}/api/auth/google/callback`;
  }
  return envUri || "http://localhost:5179/api/auth/google/callback";
}
const GOOGLE_REDIRECT_URI = computeRedirectUri();

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "[Google OAuth] Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET — callback will fail."
  );
}
if (
  IS_PROD &&
  /^https?:\/\/localhost/i.test(process.env.GOOGLE_REDIRECT_URI || "")
) {
  console.warn(
    "[Google OAuth] GOOGLE_REDIRECT_URI pointe vers localhost en production — ignoré. Utilisation de",
    GOOGLE_REDIRECT_URI
  );
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Code flow (serveur)
const oauthClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

/* --- Admin whitelist via env --- */
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || "")
  .split(/[,\s]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/* ============ Helpers ============ */
function sessionFromUser(user) {
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
  const expiresAt = Date.now() + parseExpMs(jwtExpiresIn);

  const roles =
    Array.isArray(user.roles) && user.roles.length ? user.roles : ["user"];
  const kinds = computeSessionKinds(roles);

  const token = sign({
    sub: String(user._id),
    roles,
    kinds,
  });

  const localEnabled = user.localEnabled === true && !user.googleId;

  return {
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
      localEnabled,
      twoFAEnabled: true,
    },
  };
}

async function maybeUpdateAvatar(user, picture, publicIdHint) {
  if (!picture) return;
  try {
    const publicId = publicIdHint || `u_${user._id}`;
    const url = await uploadAvatarFromUrl(picture, publicId);
    if (url && url !== user.avatarUrl) user.avatarUrl = url;
  } catch (e) {
    console.error("[cloudinary avatar] fail:", e?.message || e);
  }
}

function normalizeReferralCode(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

async function ensureAdminIfWhitelisted(user) {
  try {
    const mail = (user.email || "").toLowerCase();
    if (!ADMIN_EMAILS.length || !mail) return;
    if (ADMIN_EMAILS.includes(mail)) {
      const roles = Array.from(new Set([...(user.roles || []), "admin"]));
      if (JSON.stringify(roles) !== JSON.stringify(user.roles || [])) {
        user.roles = roles;
        await user.save();
      }
    }
  } catch (e) {
    console.error("[ensureAdminIfWhitelisted] fail:", e?.message || e);
  }
}

function pickVisitorId(req) {
  const h = req.headers || {};
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

async function tryMapVisitorIdentity(req, userId, explicitVisitorId) {
  try {
    const visitorId = explicitVisitorId || pickVisitorId(req);
    if (!visitorId) return;

    const ip = getClientIp(req);
    const ipHashVal = hashIp(ip);

    await AnalyticsIdentity.updateOne(
      { user: userId, visitorId },
      {
        $setOnInsert: { firstSeenAt: new Date() },
        $set: {
          lastSeenAt: new Date(),
          ua: req.headers["user-agent"] || "",
          ipHash: ipHashVal,
        },
        $inc: { seen: 1 },
      },
      { upsert: true }
    );
  } catch (e) {
    console.warn("[analytics identify] skipped:", e?.message || e);
  }
}

/* ============ POST /auth/google  (GIS id_token) ============ */
router.post("/", async (req, res) => {
  try {
    const { credential, referralCode: rawRef1, ref: rawRef2 } = req.body || {};
    if (!credential) return fail(res, "Jeton Google manquant");

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email || "");
    if (!email) return fail(res, "Token Google invalide");

    const name = payload?.name || email;
    const picture = payload?.picture || "";
    const sub = payload?.sub;
    const emailVerified = !!payload?.email_verified;

    if (!email || !sub) return fail(res, "Token Google invalide");
    if (!emailVerified) return fail(res, "Email Google non vérifié");

    const refCode = normalizeReferralCode(rawRef1 || rawRef2);

    let user = await User.findOne({ email }).select("+passwordHash").exec();
    let createdNew = false;

    if (!user) {
      let referredBy = null;
      if (refCode) {
        const sponsor = await User.findOne({ referralCode: refCode })
          .select("_id")
          .lean();
        if (sponsor) referredBy = sponsor._id;
      }

      const roles = ADMIN_EMAILS.includes(email.toLowerCase())
        ? ["user", "admin"]
        : ["user"];

      const randomHash = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );
      user = await User.create({
        fullName: name,
        email,
        passwordHash: randomHash,
        roles,
        isActive: true,
        googleId: sub,
        localEnabled: false,
        avatarUrl: "",
        referredBy,
      });
      createdNew = true;
    } else if (!user.googleId) {
      return ok(res, {
        conflict: true,
        redirectUrl: `${buildFrontendBase()}/?auth_error=ACCOUNT_EXISTS_NEEDS_LINK`,
      });
    }

    if (user.googleId && user.localEnabled !== false) user.localEnabled = false;

    await ensureAdminIfWhitelisted(user);
    await maybeUpdateAvatar(user, picture, `u_${user._id}`);
    await user.save();

    if (createdNew) {
      sendWelcomeEmail(user.email, user.fullName).catch((e) =>
        console.error("[welcome] send failed:", e?.message || e)
      );
    }

    await recordLogin(req, user, "google-oauth", true);
    await tryMapVisitorIdentity(req, user._id);

    const session = sessionFromUser(user);
    const redirectUrl = buildFrontendAuthSuccessUrl(session);
    return ok(res, { session, redirectUrl });
  } catch (e) {
    console.error("/auth/google:", e?.message || e);
    return fail(res, "Connexion Google impossible");
  }
});

/* ============ POST /auth/google/link-token (mint) ============ */
router.post("/link-token", (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");
    const linkToken = jwt.sign(
      { kind: "link-google", uid: String(userId) },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return ok(res, { linkToken });
  } catch (e) {
    console.error("/auth/google/link-token:", e?.message || e);
    return fail(res, "LINK_TOKEN_FAIL");
  }
});

/* ============ GET /auth/google/start (code flow) ============ */
router.get("/start", (req, res) => {
  const from = req.query.from || "/";
  const open = req.query.open || "";
  const mode = req.query.mode === "link" ? "link" : "login";
  const lt = req.query.lt;

  const ref = normalizeReferralCode(req.query.ref);
  const vid = typeof req.query.vid === "string" ? req.query.vid : "";

  const statePayload =
    mode === "link" && lt
      ? { from, open, mode: "link", linkToken: lt }
      : {
          from,
          open,
          mode: "login",
          ...(ref ? { ref } : {}),
          ...(vid ? { vid } : {}),
        };

  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const url = oauthClient.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
    redirect_uri: GOOGLE_REDIRECT_URI, // 👈 forcer l’URI choisie
  });

  res.redirect(url);
});

/* ============ GET /auth/google/callback (code flow) ============ */
router.get("/callback", async (req, res) => {
  const redirectHomeWith = (code) =>
    res.redirect(
      302,
      `${buildFrontendBase()}/?auth_error=${encodeURIComponent(code)}`
    );

  try {
    const { code, state } = req.query;
    if (!code || !state) return redirectHomeWith("MISSING_CODE_OR_STATE");

    let tokens;
    try {
      const r = await oauthClient.getToken({
        code: String(code),
        redirect_uri: GOOGLE_REDIRECT_URI, // 👈 idem ici
      });
      tokens = r.tokens;
    } catch (e) {
      const detail = e?.response?.data || e?.message || e;
      console.error("[google.getToken] fail:", detail);
      return redirectHomeWith("GOOGLE_TOKEN_EXCHANGE_FAILED");
    }

    const idToken = tokens.id_token;
    if (!idToken) {
      console.error("[google.getToken] missing id_token in tokens]:", tokens);
      return redirectHomeWith("GOOGLE_NO_ID_TOKEN");
    }

    let stateObj = {};
    try {
      stateObj = JSON.parse(
        Buffer.from(String(state), "base64url").toString("utf8")
      );
    } catch {
      return redirectHomeWith("STATE_PARSE_ERROR");
    }
    const mode = stateObj?.mode === "link" ? "link" : "login";

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      console.error(
        "[verifyIdToken] fail:",
        e?.response?.data || e?.message || e
      );
      return redirectHomeWith("ID_TOKEN_VERIFY_FAILED");
    }

    const email = normalizeEmail(payload?.email || "");
    const fullName = payload?.name || email;
    const picture = payload?.picture || "";
    const googleSub = payload?.sub;
    const emailVerified = !!payload?.email_verified;

    if (!email || !googleSub) return redirectHomeWith("INVALID_GOOGLE_PAYLOAD");
    if (!emailVerified) return redirectHomeWith("EMAIL_NOT_VERIFIED");

    if (mode === "link") {
      let decoded;
      try {
        decoded = jwt.verify(stateObj.linkToken, process.env.JWT_SECRET);
        if (decoded?.kind !== "link-google" || !decoded?.uid)
          throw new Error("Invalid link token");
      } catch {
        return redirectHomeWith("LINK_TOKEN_INVALID");
      }

      const targetUser = await User.findById(decoded.uid)
        .select("+passwordHash")
        .exec();
      if (!targetUser) return redirectHomeWith("ACCOUNT_NOT_FOUND");

      const already = await User.findOne({
        googleId: googleSub,
        _id: { $ne: targetUser._id },
      }).lean();
      if (already) return redirectHomeWith("GOOGLE_ALREADY_LINKED");

      if (normalizeEmail(targetUser.email) !== email) {
        return redirectHomeWith("EMAIL_MISMATCH");
      }

      if (targetUser.googleId) {
        if (targetUser.localEnabled !== false) targetUser.localEnabled = false;
        await ensureAdminIfWhitelisted(targetUser);
        await tryMapVisitorIdentity(req, targetUser._id, stateObj?.vid);
        const sess = sessionFromUser(targetUser);
        const redir = buildFrontendAuthSuccessUrl(sess);
        return res.redirect(302, redir);
      }

      targetUser.googleId = googleSub;
      targetUser.localEnabled = false;
      await maybeUpdateAvatar(targetUser, picture, `u_${targetUser._id}`);
      await ensureAdminIfWhitelisted(targetUser);
      await targetUser.save();

      await recordLogin(req, targetUser, "google-link", true);
      await tryMapVisitorIdentity(req, targetUser._id, stateObj?.vid);

      const sess = sessionFromUser(targetUser);
      const redir = buildFrontendAuthSuccessUrl(sess);
      return res.redirect(302, redir);
    }

    // ====== LOGIN ======
    const refFromState = normalizeReferralCode(stateObj?.ref);

    let user = await User.findOne({ email }).select("+passwordHash").exec();
    let createdNew = false;

    if (!user) {
      let referredBy = null;
      if (refFromState) {
        const sponsor = await User.findOne({ referralCode: refFromState })
          .select("_id")
          .lean();
        if (sponsor) referredBy = sponsor._id;
      }

      const roles = ADMIN_EMAILS.includes(email.toLowerCase())
        ? ["user", "admin"]
        : ["user"];

      let avatarUrl = "";
      try {
        if (picture)
          avatarUrl = await uploadAvatarFromUrl(picture, `google_${googleSub}`);
      } catch (e) {
        console.warn("[Google] avatar upload failed:", e?.message);
      }

      user = await User.create({
        fullName,
        email,
        passwordHash: await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          10
        ),
        avatarUrl,
        roles,
        isActive: true,
        googleId: googleSub,
        localEnabled: false,
        referredBy,
      });
      createdNew = true;
    } else if (!user.googleId) {
      const redirectUrl = `${buildFrontendBase()}/?auth_error=ACCOUNT_EXISTS_NEEDS_LINK`;
      return res.redirect(302, redirectUrl);
    }

    if (user.googleId && user.localEnabled !== false) user.localEnabled = false;
    await ensureAdminIfWhitelisted(user);
    await user.save();

    if (createdNew) {
      sendWelcomeEmail(user.email, user.fullName).catch((e) =>
        console.error("[welcome] send failed:", e?.message || e)
      );
    }

    await recordLogin(req, user, "google-oauth", true);
    await tryMapVisitorIdentity(req, user._id, stateObj?.vid);

    const session = sessionFromUser(user);
    const redirectUrl = buildFrontendAuthSuccessUrl(session);
    return res.redirect(302, redirectUrl);
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("google/callback:", e?.message || e, { status, data });
    return res.status(500).send("Google OAuth failed");
  }
});

/* ============ DELETE /auth/google/unlink ============ */
router.delete("/unlink", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");

    const { newPassword } = req.body || {};
    const user = await User.findById(userId).select("+passwordHash").exec();
    if (!user) return fail(res, "Compte introuvable");

    if (!user.googleId) {
      if (user.localEnabled !== true) {
        user.localEnabled = true;
        await ensureAdminIfWhitelisted(user);
        await user.save();
      }
      const session = sessionFromUser(user);
      return ok(res, { session, alreadyUnlinked: true });
    }

    if (!newPassword || String(newPassword).length < 8) {
      return fail(res, "SET_PASSWORD_REQUIRED");
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.localEnabled = true;
    user.googleId = undefined;

    await ensureAdminIfWhitelisted(user);
    await user.save();
    await recordLogin(req, user, "google-unlink", true);

    const session = sessionFromUser(user);
    return ok(res, { session });
  } catch (e) {
    console.error("/auth/google/unlink:", e?.message || e);
    return fail(res, "Impossible de délier Google");
  }
});

module.exports = router;
