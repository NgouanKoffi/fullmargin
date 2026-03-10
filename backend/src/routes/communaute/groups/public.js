const {
  makeRid,
  CommunityGroup,
  CommunityMember,
  buildMembersCountMap,
  verifyAuthHeader,
} = require("./_shared");

/**
 * GET /api/communaute/groups/public
 * - Groupes "public" visibles par tout le monde
 * - Groupes "private" visibles seulement si :
 *    • user connecté ET
 *    • owner du groupe OU owner de la communauté OU membre de la communauté
 */
module.exports = (router) => {
  router.get("/public", async (req, res) => {
    const rid = makeRid(req);
    try {
      // 🔑 Auth optionnelle
      let userId = null;
      try {
        const auth = verifyAuthHeader(req);
        if (auth && auth.userId) {
          userId = String(auth.userId);
        }
      } catch {
        userId = null;
      }

      const groups = await CommunityGroup.find({
        deletedAt: null,
      })
        .populate({ path: "community", select: "name ownerId" })
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      const membersMap = await buildMembersCountMap(groups);

      let visibleGroups = groups;

      if (!userId) {
        // ❌ Pas connecté → on masque tous les groupes privés
        visibleGroups = groups.filter(
          (g) =>
            (g.visibility === "private" ? "private" : "public") === "public"
        );
      } else {
        // ✅ Connecté → visibles = publics + privés des communautés où il est membre / owner
        const communityIds = [
          ...new Set(
            groups
              .filter((g) => g.community)
              .map((g) =>
                typeof g.community === "object"
                  ? String(g.community._id)
                  : String(g.community)
              )
          ),
        ];

        let membershipSet = new Set();

        if (communityIds.length) {
          const memberships = await CommunityMember.find({
            communityId: { $in: communityIds },
            userId,
            $or: [{ status: "active" }, { status: { $exists: false } }],
          })
            .select({ communityId: 1 })
            .lean();

          membershipSet = new Set(
            memberships.map((m) => String(m.communityId))
          );
        }

        visibleGroups = groups.filter((g) => {
          const visibility = g.visibility === "private" ? "private" : "public";
          if (visibility === "public") return true;

          const commId =
            g.community && typeof g.community === "object"
              ? String(g.community._id)
              : String(g.community);

          const isGroupOwner = String(g.owner) === String(userId);
          const isCommunityOwner =
            g.community &&
            typeof g.community === "object" &&
            String(g.community.ownerId) === String(userId);
          const isCommunityMember = membershipSet.has(commId);

          // 🔐 privé → visible si owner groupe, owner communauté ou membre communauté
          return isGroupOwner || isCommunityOwner || isCommunityMember;
        });
      }

      const items = visibleGroups.map((g) => {
        const visibility = g.visibility === "private" ? "private" : "public";

        return {
          id: String(g._id),
          communityId:
            g.community && typeof g.community === "object"
              ? String(g.community._id)
              : String(g.community),
          name: g.name || "Groupe sans nom",
          description: g.description || "",
          accessType: g.accessType === "course" ? "course" : "free",
          coverUrl: g.coverUrl || null,
          createdAt: g.createdAt?.toISOString?.() || null,
          communityName:
            g.community && typeof g.community === "object"
              ? g.community.name || null
              : null,
          membersCount: membersMap.get(String(g._id)) || 0,
          courseTitle: g.courseTitle ?? undefined,
          visibility,
        };
      });

      return res.status(200).json({ ok: true, data: { items } });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] GET /groups/public ERROR: ${e?.stack || e}`
      );
      return res.status(500).json({
        ok: false,
        error: "Chargement des groupes publics impossible",
      });
    }
  });
};
