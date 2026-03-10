const {
  requireAuth,
  assertCanView,
  autoEndLiveIfExpired,
  mapLive,
  CommunityLive,
} = require("./_shared");

/**
 * GET /api/communaute/lives/:id
 * -> détails d’un live (page publique / salle)
 */
module.exports = (router) => {
  router.get("/:id", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;

    try {
      const live = await CommunityLive.findById(id);
      if (!live) {
        return res.status(404).json({ ok: false, error: "Live introuvable." });
      }

      await autoEndLiveIfExpired(live);

      const check = await assertCanView(
        userId,
        String(live.communityId),
        !!live.isPublic
      );
      if (!check.ok) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      return res.json({
        ok: true,
        data: {
          // ✅ important : mapLive(live, userId) pour que isOwner soit calculé
          live: mapLive(live, userId),
        },
      });
    } catch (e) {
      console.error("[LIVES] GET /:id ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger ce live.",
      });
    }
  });
};
