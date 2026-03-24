// backend/src/routes/communaute/lives/cancel.js
const {
  requireAuth,
  assertCanManageLives,
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

      const check = await assertCanManageLives(userId, live.communityId || null);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      // Modérateur si créateur ou proprio commu
      const creatorId = live.createdBy?._id || live.createdBy;
      const isModerator = !!(String(creatorId) === userId || (check.community && String(check.community.ownerId) === userId));
      if (!isModerator) {
        return res.status(403).json({ ok: false, error: "Seul le créateur ou l'administrateur peut annuler ce direct." });
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
