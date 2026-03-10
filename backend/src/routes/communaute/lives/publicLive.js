// backend/src/routes/communaute/lives/publicLive.js
const { requireAuth, CommunityLive } = require("./_shared");

/**
 * GET /api/communaute/lives/public-live
 * -> liste globale des lives en cours
 */
module.exports = (router) => {
  router.get("/public-live", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId); // réservé pour plus tard

    try {
      const lives = await CommunityLive.find({
        status: "live",
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "communityId",
          select: { name: 1, slug: 1, avatarUrl: 1, coverUrl: 1 },
        })
        .lean();

      const items = lives.map((l) => ({
        id: String(l._id),
        title: l.title,
        communityId: String(l.communityId?._id || l.communityId),
        communityName: l.communityId?.name || "Communauté",
        communitySlug: l.communityId?.slug || null,
        communityAvatar:
          l.communityId?.avatarUrl || l.communityId?.coverUrl || null,
        startsAt: l.startsAt ? l.startsAt.toISOString() : null,
        plannedEndAt: l.plannedEndAt ? l.plannedEndAt.toISOString() : null,
        isPublic: !!l.isPublic,
      }));

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[LIVES] GET /public-live ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les directs publics.",
      });
    }
  });
};
