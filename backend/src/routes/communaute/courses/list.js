// backend/src/routes/communaute/courses/list.js
const {
  mongoose,
  Course,
  CourseEnrollment,
  User,
  Community,
  CommunityMember,
  getAuth,
} = require("./_shared");

module.exports = (router) => {
  router.get("/", async (req, res) => {
    try {
      const { communityId, all, q } = req.query || {};

      const auth = getAuth(req);
      const userId = auth?.userId || null;

      /* ---------------------------------------------------------
       * 1) MATCH DE BASE
       * --------------------------------------------------------- */
      const match = { deletedAt: null };

      if (String(all) === "1") {
        // 🔍 MODE GLOBAL (page Formations publique)
        match.isActive = true;
      } else {
        // 🔍 MODE COMMUNAUTÉ : on exige un communityId valide
        if (!communityId) {
          return res.json({ ok: true, data: { items: [] } });
        }

        const commId =
          typeof communityId === "string" &&
          mongoose.isValidObjectId(communityId)
            ? new mongoose.Types.ObjectId(communityId)
            : null;

        if (!commId) {
          return res
            .status(400)
            .json({ ok: false, error: "communityId invalide" });
        }

        match.communityId = commId;
      }

      const pipeline = [{ $match: match }];

      /* ---------------------------------------------------------
       * 2) FILTRE TEXTE OPTIONNEL (q)
       * --------------------------------------------------------- */
      if (q && String(q).trim()) {
        const s = String(q).trim();
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: s, $options: "i" } },
              { shortDesc: { $regex: s, $options: "i" } },
            ],
          },
        });
      }

      /* ---------------------------------------------------------
       * 3) LOOKUP INSCRIPTIONS (CourseEnrollment)
       *    → enrollmentCount
       * --------------------------------------------------------- */
      pipeline.push(
        {
          $lookup: {
            from: CourseEnrollment.collection.name,
            localField: "_id",
            foreignField: "courseId",
            as: "enrolls",
          },
        },
        {
          $addFields: {
            enrollmentCount: { $size: "$enrolls" },
          },
        }
      );

      /* ---------------------------------------------------------
       * 4) LOOKUP COMMUNAUTÉ (Community)
       *    → communityName + communitySlug
       * --------------------------------------------------------- */
      pipeline.push(
        {
          $lookup: {
            from: Community.collection.name, // "communities"
            localField: "communityId",
            foreignField: "_id",
            as: "community",
          },
        },
        {
          $unwind: {
            path: "$community",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            communityName: { $ifNull: ["$community.name", ""] },
            communitySlug: { $ifNull: ["$community.slug", ""] },
          },
        }
      );

      // On nettoie quelques champs techniques avant la suite
      pipeline.push({
        $project: {
          enrolls: 0,
          community: 0,
          __v: 0,
        },
      });

      /* ---------------------------------------------------------
       * 5) LOOKUP OWNER (User)
       *    → ownerName + ownerAvatar
       * --------------------------------------------------------- */
      pipeline.push(
        {
          $lookup: {
            from: User.collection.name, // "users"
            localField: "ownerId",
            foreignField: "_id",
            as: "owner",
          },
        },
        {
          $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            ownerName: { $ifNull: ["$owner.fullName", ""] },
            ownerAvatar: { $ifNull: ["$owner.avatarUrl", ""] },
          },
        },
        { $project: { owner: 0 } },
        { $sort: { createdAt: -1 } }
      );

      /* ---------------------------------------------------------
       * 6) EXÉCUTION PIPELINE
       * --------------------------------------------------------- */
      const rows = await Course.aggregate(pipeline);

      let items = rows;

      /* ---------------------------------------------------------
       * 7) FILTRAGE VISIBILITÉ
       *
       *  - v = "public" par défaut si pas de champ visibility
       *  - private :
       *      MODE COMMUNAUTÉ   → visible si owner communauté, membre communauté, owner du cours
       *      MODE GLOBAL (all) → visible si owner cours, owner communauté ou membre communauté
       * --------------------------------------------------------- */

      // ---------- MODE COMMUNAUTÉ (avec ?communityId=...) ----------
      if (String(all) !== "1") {
        const commIdStr = String(communityId || "");

        let isOwnerCommunity = false;
        let isMemberCommunity = false;

        if (commIdStr && mongoose.isValidObjectId(commIdStr)) {
          const [communityDoc, membership] = await Promise.all([
            Community.findOne({
              _id: commIdStr,
              deletedAt: null,
            })
              .select({ ownerId: 1 })
              .lean(),
            userId
              ? CommunityMember.findOne({
                  communityId: commIdStr,
                  userId,
                  $or: [{ status: "active" }, { status: { $exists: false } }],
                })
                  .select({ _id: 1 })
                  .lean()
              : null,
          ]);

          isOwnerCommunity =
            !!communityDoc && String(communityDoc.ownerId) === String(userId);
          isMemberCommunity = !!membership;
        }

        items = rows.filter((r) => {
          const v = r.visibility === "private" ? "private" : "public";

          if (v === "public") return true;

          const isOwnerCourse =
            String(r.ownerId || "") === String(userId || "");
          return isOwnerCommunity || isMemberCommunity || isOwnerCourse;
        });
      } else {
        // ---------- MODE GLOBAL (page Formations publique, all=1) ----------
        if (!userId) {
          // Pas connecté → on ne montre JAMAIS les private
          items = rows.filter(
            (r) =>
              (r.visibility === "private" ? "private" : "public") === "public"
          );
        } else {
          // Connecté → autoriser private si :
          //  - owner du cours
          //  - OU owner de la communauté
          //  - OU membre de la communauté
          const privateWithCommunity = rows.filter(
            (r) =>
              r.visibility === "private" &&
              r.communityId &&
              mongoose.isValidObjectId(r.communityId)
          );

          let ownerCommunities = new Set();
          let memberCommunities = new Set();

          if (privateWithCommunity.length > 0) {
            const communityIds = [
              ...new Set(
                privateWithCommunity.map((r) => String(r.communityId))
              ),
            ];

            const [communities, memberships] = await Promise.all([
              Community.find({
                _id: { $in: communityIds },
                deletedAt: null,
              })
                .select({ _id: 1, ownerId: 1 })
                .lean(),
              CommunityMember.find({
                communityId: { $in: communityIds },
                userId,
                $or: [{ status: "active" }, { status: { $exists: false } }],
              })
                .select({ communityId: 1 })
                .lean(),
            ]);

            ownerCommunities = new Set(
              communities
                .filter((c) => String(c.ownerId) === String(userId))
                .map((c) => String(c._id))
            );

            memberCommunities = new Set(
              memberships.map((m) => String(m.communityId))
            );
          }

          items = rows.filter((r) => {
            const v = r.visibility === "private" ? "private" : "public";

            if (v === "public") {
              // public → visible pour tous (connectés ou non)
              return true;
            }

            const commIdStr = r.communityId ? String(r.communityId) : null;
            const isOwnerCourse =
              String(r.ownerId || "") === String(userId || "");
            const isOwnerCommunity =
              commIdStr && ownerCommunities.has(commIdStr);
            const isMemberCommunity =
              commIdStr && memberCommunities.has(commIdStr);

            return isOwnerCourse || isOwnerCommunity || isMemberCommunity;
          });
        }
      }

      /* ---------------------------------------------------------
       * 8) MAPPING FINAL POUR LE FRONT
       * --------------------------------------------------------- */
      const mapped = items.map((r) => ({
        ...r,
        id: String(r._id),
        ownerName: r.ownerName || "",
        ownerAvatar: r.ownerAvatar || "",
        // 👉 par défaut, on considère "public"
        visibility: r.visibility === "private" ? "private" : "public",
      }));

      return res.json({ ok: true, data: { items: mapped } });
    } catch (e) {
      console.error("[COURSES] list ERROR:", e?.stack || e);
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
