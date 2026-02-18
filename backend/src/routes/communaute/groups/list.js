const {
  clampStr,
  requireAuth,
  makeRid,
  Community,
  CommunityGroup,
  buildMembersCountMap,
} = require("./_shared");

/**
 * GET /api/communaute/groups?communityId=...
 */
module.exports = (router) => {
  router.get("/", requireAuth, async (req, res) => {
    const rid = makeRid(req);
    try {
      const communityId = clampStr(req.query.communityId, 60);

      if (!communityId) {
        return res
          .status(400)
          .json({ ok: false, error: "communityId invalide ou manquant" });
      }

      const community = await Community.findById(communityId).lean();
      if (!community) {
        return res
          .status(404)
          .json({ ok: false, error: "Communauté introuvable" });
      }

      const groups = await CommunityGroup.find({
        community: community._id,
        deletedAt: null,
      })
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      const membersMap = await buildMembersCountMap(groups);

      const items = groups.map((g) => ({
        id: String(g._id),
        communityId: String(g.community),
        ownerId: String(g.owner),
        name: g.name || "Groupe sans nom",
        description: g.description || "",
        accessType: g.accessType === "course" ? "course" : "free",
        courseId: g.courseId ? String(g.courseId) : null,
        coverUrl: g.coverUrl || null,
        createdAt: g.createdAt?.toISOString?.() || null,
        updatedAt: g.updatedAt?.toISOString?.() || null,
        membersCount: membersMap.get(String(g._id)) || 0,
        visibility: g.visibility === "private" ? "private" : "public",
      }));

      return res.status(200).json({ ok: true, data: { items } });
    } catch (e) {
      console.error(`[GROUPS ${rid}] GET /groups ERROR: ${e?.stack || e}`);
      return res.status(500).json({
        ok: false,
        error: "Chargement des groupes impossible",
      });
    }
  });
};
