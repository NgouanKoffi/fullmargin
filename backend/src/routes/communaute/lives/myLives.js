// backend/src/routes/communaute/lives/myLives.js
const {
  requireAuth,
  mapLive,
  CommunityLive,
} = require("./_shared");

/**
 * GET /api/communaute/lives/my-lives
 * -> liste des lives personnels de l'utilisateur
 */
module.exports = (router) => {
  router.get("/my-lives", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);

    try {
      const lives = await CommunityLive.find({ 
        createdBy: userId,
      })
        .populate({
          path: "createdBy",
          select: { fullName: 1, avatarUrl: 1 },
        })
        .sort({ startsAt: -1, createdAt: -1 })
        .lean();

      // ✅ IMPORTANT : passer userId -> isOwner devient fiable
      const items = lives.map((l) => mapLive(l, userId));

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[LIVES] GET /my-lives ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger tes directs.",
      });
    }
  });
};
