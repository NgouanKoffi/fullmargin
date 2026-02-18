// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\auth\me.js
const express = require("express");

const User = require("../../models/user.model");
const PresenceSession = require("../../models/presenceSession.model"); // 👈 modèle d'historique (déjà en place)

const { ok, verifyAuthHeader } = require("./_helpers");

const router = express.Router();

/* ============ Me ============ */
router.get("/me", async (req, res) => {
  try {
    const { token, userId } = verifyAuthHeader(req);
    if (!token || !userId) return res.json(null);

    const user = await User.findById(userId).lean();
    if (!user) return res.json(null);

    // Compatibilité localEnabled:
    const localAllowed =
      user.localEnabled === true ||
      (user.localEnabled === undefined && !user.googleId);

    const roles = user.roles || ["user"];
    const isAdmin = roles.includes("admin");
    const isAgent = roles.includes("agent");

    return res.json({
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      coverUrl: user.coverUrl || "",
      roles,
      // infos pratiques directement exploitables au front
      isAdmin,
      isAgent,
      googleLinked: !!user.googleId,
      localEnabled: !!localAllowed,
      twoFAEnabled: user.twoFAEnabled !== false,
    });
  } catch {
    return res.json(null);
  }
});

/* ============ Historique des connexions (compat) ============ */
/**
 * Utilise les sessions de présence au lieu de LoginHistory.
 * Shape retourné:
 *  - id, at (== startedAt), ua, method="presence-session", success=true
 *  - bonus: startedAt, endedAt, durationMs, endReason
 */
router.get("/logins", async (req, res) => {
  try {
    const { token, userId } = verifyAuthHeader(req);
    if (!token || !userId) return ok(res, { items: [] });

    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

    const items = await PresenceSession.find({ user: userId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    return ok(res, {
      items: items.map((s) => ({
        id: String(s._id),
        at: s.startedAt,
        ua: s.ua || "",
        ipHash: "",
        method: "presence-session",
        success: true,
        startedAt: s.startedAt,
        endedAt: s.endedAt || null,
        durationMs: s.durationMs || 0,
        endReason: s.endReason || "",
      })),
    });
  } catch (e) {
    console.error("/auth/logins:", e);
    return ok(res, { items: [] });
  }
});

module.exports = router;
