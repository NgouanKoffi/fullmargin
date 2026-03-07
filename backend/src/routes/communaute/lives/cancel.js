// backend/src/routes/communaute/lives/cancel.js
const {
  requireAuth,
  assertIsOwner,
  mapLive,
  CommunityLive,
} = require("./_shared");

/**
 * POST /api/communaute/lives/:id/cancel
 * -> annuler un direct programmé
 */
module.exports = (router) => {
  router.post("/:id/cancel", requireAuth, async (req, res) => {
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

      if (live.status === "cancelled" || live.status === "ended") {
        return res.json({ ok: true, data: { live: mapLive(live, userId) } });
      }

      if (live.status !== "scheduled") {
        return res.status(400).json({
          ok: false,
          error: "Seuls les directs programmés peuvent être annulés.",
        });
      }

      live.status = "cancelled";
      live.endedAt = new Date();
      await live.save();

      // ❌ Aucune notification déclenchée

      return res.json({ ok: true, data: { live: mapLive(live, userId) } });
    } catch (e) {
      console.error("[LIVES] POST /:id/cancel ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible d’annuler ce live.",
      });
    }
  });
};
