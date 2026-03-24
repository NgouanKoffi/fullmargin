// backend/src/routes/communaute/lives/end.js
const {
  requireAuth,
  assertCanManageLives,
  mapLive,
  CommunityLive,
} = require("./_shared");

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

      const check = await assertCanManageLives(userId, live.communityId || null);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      // Modérateur si créateur ou proprio commu
      const creatorId = live.createdBy?._id || live.createdBy;
      const isModerator = !!(String(creatorId) === userId || (check.community && String(check.community.ownerId) === userId));
      if (!isModerator) {
        return res.status(403).json({ ok: false, error: "Seul le créateur ou l'administrateur peut terminer ce direct." });
      }

      if (live.status === "ended" || live.status === "cancelled") {
        return res.json({ ok: true, data: { live: mapLive(live, userId) } });
      }

      live.status = "ended";
      live.endedAt = new Date();
      await live.save();

      // ❌ Aucune notification déclenchée

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
