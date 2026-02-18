const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");
const FmMetrix = require("../../models/fmmetrix.model");
const { fail, verifyAuthHeader } = require("./_helpers");

const router = express.Router();

/**
 * GET /api/auth/sso/fullmetrix
 */
router.get("/fullmetrix", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const user = await User.findById(userId).lean();
    if (!user) return fail(res, "Compte introuvable", 404);

    const sub = await FmMetrix.findOne({ userId }).lean();
    const now = new Date();

    const wantsJson = req.query.mode === "json";

    // pas d'abo ou abo expiré → on renvoie vers le front
    if (!sub || !sub.validUntil || new Date(sub.validUntil) <= now) {
      const redirectBase =
        process.env.FRONT_ORIGIN ||
        process.env.PUBLIC_WEB_BASE_URL ||
        process.env.APP_URL ||
        "http://localhost:5173";

      const expiredUrl = `${redirectBase.replace(
        /\/+$/,
        ""
      )}/tarifs?fm=expired`;

      if (wantsJson) {
        return res.status(403).json({
          ok: false,
          reason: "expired",
          message: "Votre abonnement FM Metrix est expiré.",
          redirectUrl: expiredUrl,
        });
      }

      return res.redirect(302, expiredUrl);
    }

    // abo OK → on génère le SSO
    const payload = {
      sub: String(user._id),
      email: user.email,
      name: user.fullName || user.displayName || user.name || "",
      plan: "pro",
      paymentStatus: "active",
      exp: Math.floor(Date.now() / 1000) + 120, // 2 min
    };

    const secret =
      process.env.SSO_PARTNER_SECRET ||
      process.env.SSO_FULLMETRIX_SECRET ||
      "dev-fullmetrix-secret-change-me";

    const token = jwt.sign(payload, secret, { algorithm: "HS256" });

    const callbackBase =
      process.env.SSO_FULLMETRIX_CALLBACK ||
      "https://ia.fullmargin.net/auth/sso/callback";

    const redirectUrl = `${callbackBase.replace(
      /\/+$/,
      ""
    )}?token=${encodeURIComponent(token)}`;

    if (wantsJson) {
      return res.json({
        ok: true,
        redirectUrl,
        token,
      });
    }

    return res.redirect(302, redirectUrl);
  } catch (e) {
    console.error("[GET /auth/sso/fullmetrix]", e?.message || e);
    return fail(res, "SSO impossible", 500);
  }
});

module.exports = router;
