// backend/src/routes/communaute/lives/jitsiToken.js
const jwt = require("jsonwebtoken");
const { requireAuth, assertCanView, CommunityLive } = require("./_shared");

function safeName(raw) {
  let s = String(raw || "");
  try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch {}
  return s.replace(/[^A-Za-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

module.exports = (router) => {
  router.get("/:id/jitsi-token", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;

    const JITSI_DOMAIN = process.env.JITSI_DOMAIN || "live.fullmargin.net";
    const APP_ID = process.env.JITSI_APP_ID;
    const APP_SECRET = process.env.JITSI_APP_SECRET;

    if (!APP_ID || !APP_SECRET) return res.status(500).json({ ok: false, error: "Config Jitsi JWT manquante." });

    try {
      const live = await CommunityLive.findById(id).lean();
      if (!live) return res.status(404).json({ ok: false, error: "Live introuvable." });

      const check = await assertCanView(userId, String(live.communityId), !!live.isPublic);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      const community = check.community;
      const isOwner = !!((community && String(community.ownerId) === String(userId)) || String(live.createdBy) === String(userId));
      const displayName = safeName(req.query.name) || "Membre FullMargin";

      // On s'assure que le nom envoyé est strictement en minuscules, comme attendu par Jitsi
      const exactRoom = String(live.roomName).toLowerCase();
      const now = Math.floor(Date.now() / 1000);
      
      const payload = {
        aud: "jitsi",         
        iss: APP_ID,          
        sub: JITSI_DOMAIN, 
        room: exactRoom, 
        iat: now - 60,        
        nbf: now - 600, 
        exp: now + 7200, 
        
        moderator: isOwner ? true : false, 
        
        context: {
          user: {
            id: userId,
            name: displayName,
            email: req.auth.email || "",
            moderator: isOwner ? true : false, 
            affiliation: isOwner ? "owner" : "member" // Lu par le module token_affiliation de Prosody
          },
          features: { livestreaming: true, recording: true, transcription: true }
        },
      };

      const token = jwt.sign(payload, APP_SECRET, { algorithm: "HS256", noTimestamp: true });

      return res.json({ ok: true, data: { token, room: exactRoom, isOwner } });
    } catch (e) {
      console.error("[LIVES] JWT ERROR:", e);
      return res.status(500).json({ ok: false, error: "Impossible de générer le token." });
    }
  });
};