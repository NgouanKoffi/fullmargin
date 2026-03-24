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
    const effectiveCommunityId = (communityId === "null" || communityId === "undefined" || !communityId) 
      ? null 
      : communityId;

    try {
      if (effectiveCommunityId) {
        await autoEndExpiredLivesForCommunity(effectiveCommunityId);
      }

      // On cherche les lives de la communauté, PLUS les directs personnels de l'utilisateur actuel
      const lives = await CommunityLive.find({
        $or: [
          { communityId: effectiveCommunityId },
          { createdBy: userId, communityId: null },
        ],
      })
        .populate({
          path: "createdBy",
          select: { fullName: 1, avatarUrl: 1 },
        })
        .sort({ startsAt: -1, createdAt: -1 })
        .lean();

      const visible = [];
      for (const l of lives) {
        const check = await assertCanView(userId, l.communityId, !!l.isPublic, l.createdBy);
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
