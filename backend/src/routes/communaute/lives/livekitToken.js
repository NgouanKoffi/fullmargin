// backend/src/routes/communaute/lives/livekitToken.js
const { AccessToken } = require("livekit-server-sdk");
const { requireAuth, assertCanView, CommunityLive } = require("./_shared");

function safeName(raw) {
  let s = String(raw || "");
  try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch {}
  return s.replace(/[^A-Za-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

module.exports = (router) => {
  // 🔴 Route pour générer le token LiveKit
  router.get("/:id/livekit-token", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;

    // Récupération des clés depuis le .env
    const API_KEY = process.env.LIVEKIT_API_KEY;
    const API_SECRET = process.env.LIVEKIT_API_SECRET;

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ ok: false, error: "Clés LiveKit manquantes dans le .env." });
    }

    try {
      const live = await CommunityLive.findById(id).lean();
      if (!live) return res.status(404).json({ ok: false, error: "Live introuvable." });

      const check = await assertCanView(userId, String(live.communityId), !!live.isPublic);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      const community = check.community;
      const isOwner = !!((community && String(community.ownerId) === String(userId)) || String(live.createdBy) === String(userId));
      
      const displayName = safeName(req.query.name) || "Membre FullMargin";
      const exactRoom = String(live.roomName);

      // ✅ Initialisation du Token
      const at = new AccessToken(API_KEY, API_SECRET, {
        identity: userId,
        name: displayName,
      });

      // ✅ Configuration des permissions de base
      const permissions = {
        roomJoin: true,
        room: exactRoom,
        canPublish: true,       // Activer micro/caméra
        canSubscribe: true,     // Voir/entendre les autres
        canPublishData: true,   // Utiliser le chat
      };

      // 👑 ATTRIBUTION DE "LA TOTALE" POUR L'ADMIN
      if (isOwner) {
        permissions.roomAdmin = true;           // Droit d'exclure (kick) et de couper les micros (mute)
        permissions.roomCreate = true;          // Droit de gérer les salles/sous-salles
        permissions.canUpdateOwnMetadata = true; // Permet à l'admin de mettre à jour son statut en temps réel
      }

      at.addGrant(permissions);

      const token = await at.toJwt();

      return res.json({ ok: true, data: { token, room: exactRoom, isOwner } });
    } catch (e) {
      console.error("[LIVES] LIVEKIT TOKEN ERROR:", e);
      return res.status(500).json({ ok: false, error: "Impossible de générer le token LiveKit." });
    }
  });
};