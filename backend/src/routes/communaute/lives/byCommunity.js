// backend/src/routes/communaute/lives/byCommunity.js
const {
  requireAuth,
  autoEndExpiredLivesForCommunity,
  assertCanView,
  mapLive,
  CommunityLive,
} = require("./_shared");

/**
 * GET /api/communaute/lives/by-community/:communityId
 */
module.exports = (router) => {
  router.get("/by-community/:communityId", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { communityId } = req.params;

    try {
      await autoEndExpiredLivesForCommunity(communityId);

      const lives = await CommunityLive.find({ communityId })
        .sort({ startsAt: -1, createdAt: -1 })
        .lean();

      const visible = [];
      for (const l of lives) {
        const check = await assertCanView(userId, communityId, !!l.isPublic);
        if (check.ok) {
          visible.push(l);
        }
      }

      // ✅ IMPORTANT : passer userId -> isOwner devient fiable
      const items = visible.map((l) => mapLive(l, userId));

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[LIVES] GET /by-community ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les lives.",
      });
    }
  });
};
