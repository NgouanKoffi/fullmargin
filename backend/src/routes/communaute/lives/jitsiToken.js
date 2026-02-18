const jwt = require("jsonwebtoken");
const { requireAuth, assertCanView, CommunityLive } = require("./_shared");

function safeName(raw) {
  let s = String(raw || "");
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    // ignore normalize errors
  }
  s = s
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return s;
}

/**
 * GET /api/communaute/lives/:id/jitsi-token?name=...
 * -> retourne un JWT Jitsi pour rejoindre la room
 */
module.exports = (router) => {
  router.get("/:id/jitsi-token", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;

    const JITSI_DOMAIN = process.env.JITSI_DOMAIN || "live.fullmargin.net";
    const APP_ID = process.env.JITSI_APP_ID;
    const APP_SECRET = process.env.JITSI_APP_SECRET;

    if (!APP_ID || !APP_SECRET) {
      return res.status(500).json({
        ok: false,
        error: "Config Jitsi JWT manquante (JITSI_APP_ID / JITSI_APP_SECRET).",
      });
    }

    try {
      const live = await CommunityLive.findById(id).lean();
      if (!live) {
        return res.status(404).json({ ok: false, error: "Live introuvable." });
      }

      const check = await assertCanView(
        userId,
        String(live.communityId),
        !!live.isPublic
      );
      if (!check.ok) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      // Owner = createdBy (ou ownerId si tu l'as)
      const ownerId = String(live.ownerId || live.createdBy || "");
      const isOwner = ownerId && String(ownerId) === String(userId);

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 60 * 60; // 1h

      const displayName = safeName(req.query.name) || "Membre FullMargin";

      // ⚠️ Compat: certaines stacks lisent moderator au root, d'autres via context.user.moderator
      const payload = {
        aud: "jitsi",
        iss: APP_ID,
        sub: JITSI_DOMAIN,
        room: String(live.roomName), // token valable seulement pour cette room
        exp,
        nbf: now - 10,
        moderator: !!isOwner, // ✅ important (compat)
        context: {
          user: {
            id: userId,
            name: displayName,
            moderator: !!isOwner, // ✅ important (compat)
          },
        },
      };

      const token = jwt.sign(payload, APP_SECRET, { algorithm: "HS256" });

      return res.json({
        ok: true,
        data: {
          token,
          room: live.roomName,
          isOwner: !!isOwner,
        },
      });
    } catch (e) {
      console.error("[LIVES] GET /:id/jitsi-token ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de générer le token Jitsi.",
      });
    }
  });
};
