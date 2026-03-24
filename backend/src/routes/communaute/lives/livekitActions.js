// backend/src/routes/communaute/lives/livekitActions.js
const { RoomServiceClient, TrackSource } = require("livekit-server-sdk");
const { requireAuth, assertCanView, CommunityLive } = require("./_shared");

module.exports = (router) => {
  // Route pour désactiver un micro ou expulser un participant
  router.post("/:id/livekit-actions", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;
    const { action, identity, trackSid, canPublishMic, canPublishScreen } = req.body;

    const API_KEY = process.env.LIVEKIT_API_KEY;
    const API_SECRET = process.env.LIVEKIT_API_SECRET;
    const LIVEKIT_URL = process.env.LIVEKIT_WS_URL || "https://live.fullmargin.net";

    if (!API_KEY || !API_SECRET) {
      return res.status(500).json({ ok: false, error: "Clés LiveKit manquantes." });
    }

    try {
      const live = await CommunityLive.findById(id).lean();
      if (!live) return res.status(404).json({ ok: false, error: "Live introuvable." });

      const check = await assertCanView(userId, live.communityId || null, !!live.isPublic, live.createdBy);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      const community = check.community;
      const creatorId = live.createdBy?._id || live.createdBy;
      const isOwner = !!((community && String(community.ownerId) === String(userId)) || String(creatorId) === String(userId));
      
      if (!isOwner) {
        return res.status(403).json({ ok: false, error: "Seul l'administrateur peut effectuer cette action." });
      }

      const exactRoom = String(live.roomName);
      const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

      if (action === "mute") {
        if (!trackSid) return res.status(400).json({ ok: false, error: "trackSid manquant pour le mute." });
        await roomService.mutePublishedTrack(exactRoom, identity, trackSid, true);
        return res.json({ ok: true, message: "Micro coupé avec succès." });
      } 
      
      if (action === "kick") {
        await roomService.removeParticipant(exactRoom, identity);
        return res.json({ ok: true, message: "Participant expulsé avec succès." });
      }

      if (action === "toggle_permission") {
        const sources = [TrackSource.CAMERA];
        if (canPublishMic) sources.push(TrackSource.MICROPHONE);
        if (canPublishScreen) sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);

        const permission = {
          roomJoin: true,
          room: exactRoom,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          canPublishSources: sources
        };
        
        const meta = JSON.stringify({ mic: canPublishMic, screen: canPublishScreen });
        await roomService.updateParticipant(exactRoom, identity, meta, permission);

        // Force mute ongoing tracks if permission is being revoked
        try {
          const pInfo = await roomService.getParticipant(exactRoom, identity);
          for (const track of pInfo.tracks) {
            if (!canPublishMic && track.source === TrackSource.MICROPHONE) {
              await roomService.mutePublishedTrack(exactRoom, identity, track.sid, true);
            }
            if (!canPublishScreen && track.source === TrackSource.SCREEN_SHARE) {
              await roomService.mutePublishedTrack(exactRoom, identity, track.sid, true);
            }
          }
        } catch(e) { /* ignore if participant left or tracks don't exist */ }

        return res.json({ ok: true, message: "Permissions mises à jour." });
      }

      return res.status(400).json({ ok: false, error: "Action inconnue." });
    } catch (e) {
      console.error("[LIVES] LIVEKIT ACTION ERROR:", e);
      return res.status(500).json({ ok: false, error: "Impossible d'exécuter l'action LiveKit." });
    }
  });
};
