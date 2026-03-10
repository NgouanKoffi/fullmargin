// routes/auth/2fa.js
const express = require("express");
const User = require("../../models/user.model");
const { ok, fail, verifyAuthHeader, parseExpMs } = require("./_helpers");
const { sign } = require("../../utils/jwt");

const router = express.Router();

/** Helper: construit une session cohérente avec le front */
function sessionFromUser(user) {
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
  const expiresAt = Date.now() + parseExpMs(jwtExpiresIn);
  const token = sign({ sub: String(user._id), roles: user.roles || ["user"] });

  return {
    token,
    expiresAt,
    user: {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      roles: user.roles || ["user"],
      googleLinked: !!user.googleId,
      localEnabled: user.localEnabled === true,
      twoFAEnabled: user.twoFAEnabled !== false, // undefined => true (par défaut ON)
    },
  };
}

/**
 * PATCH /auth/2fa
 * Body: { enable: boolean }
 * - Refuse pour les comptes Google (géré automatiquement côté UX).
 * - Met à jour user.twoFAEnabled, renvoie { ok:true, session }.
 */
router.patch("/", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");

    const { enable } = req.body || {};
    if (typeof enable !== "boolean") {
      return fail(res, "Paramètre invalide");
    }

    const user = await User.findById(userId).exec();
    if (!user) return fail(res, "Compte introuvable");

    // Côté produit: on bloque pour les comptes Google
    if (user.googleId) {
      return fail(res, "TWO_FA_MANAGED_BY_GOOGLE");
    }

    user.twoFAEnabled = !!enable; // true => OTP requis; false => connexion directe
    await user.save();

    const session = sessionFromUser(user);
    return ok(res, { session });
  } catch (e) {
    console.error("/auth/2fa:", e?.message || e);
    return fail(res, "Impossible de mettre à jour la 2FA");
  }
});

module.exports = router;