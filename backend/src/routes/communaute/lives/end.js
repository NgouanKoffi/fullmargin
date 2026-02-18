// backend/src/routes/communaute/lives/end.js
const {
  requireAuth,
  assertIsOwner,
  mapLive,
  CommunityLive,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

/**
 * POST /api/communaute/lives/:id/end
 * -> termine un live (seul l'owner peut le faire)
 */
module.exports = (router) => {
  router.post("/:id/end", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;

    try {
      const live = await CommunityLive.findById(id);
      if (!live) {
        return res.status(404).json({ ok: false, error: "Live introuvable." });
      }

      const check = await assertIsOwner(userId, String(live.communityId));
      if (!check.ok) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      if (live.status === "ended" || live.status === "cancelled") {
        return res.json({ ok: true, data: { live: mapLive(live, userId) } });
      }

      live.status = "ended";
      live.endedAt = new Date();
      await live.save();

      // 🔔 notif live terminé
      await createNotif({
        userId,
        kind: "live_ended",
        communityId: String(live.communityId),
        payload: {
          liveId: String(live._id),
          title: live.title,
          endedAt: live.endedAt,
        },
      });

      return res.json({ ok: true, data: { live: mapLive(live, userId) } });
    } catch (e) {
      console.error("[LIVES] POST /:id/end ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de terminer ce live.",
      });
    }
  });
};
