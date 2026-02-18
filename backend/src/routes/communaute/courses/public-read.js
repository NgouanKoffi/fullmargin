// backend/src/routes/communaute/courses/public-read.js
"use strict";

const {
  Course,
  User,
  Community,
  CommunityMember,
  getAuth,
  isUserEnrolled,
} = require("./_shared");

module.exports = (router) => {
  /**
   * GET /api/communaute/courses/public/:id
   * → fiche publique du cours
   *
   * ⚠️ IMPORTANT :
   *  - on NE bloque pas ici les cours "private"
   *  - on renvoie toujours la fiche publique si le cours existe
   *  - le blocage d'accès au contenu reste dans /api/communaute/courses/:id (read.js)
   */
  router.get("/public/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const course = await Course.findOne({
        _id: id,
        deletedAt: null,
        isActive: true,
      }).lean();

      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      const visibility = course.visibility === "private" ? "private" : "public";

      const auth = getAuth(req);
      const userId = auth?.userId || null;

      // ---------- Métadonnées communauté + statut membre ----------
      let communityMeta = null;

      if (course.communityId) {
        const community = await Community.findOne({
          _id: course.communityId,
          deletedAt: null,
        })
          .select({
            _id: 1,
            name: 1,
            slug: 1,
            logoUrl: 1,
            coverUrl: 1,
            ownerId: 1,
          })
          .lean();

        if (community) {
          let isOwner = false;
          let isMember = false;

          if (userId) {
            isOwner = String(community.ownerId) === String(userId);

            const membership = await CommunityMember.findOne({
              communityId: community._id,
              userId,
              $or: [{ status: "active" }, { status: { $exists: false } }],
            })
              .select({ _id: 1 })
              .lean();

            isMember = !!membership;
          }

          communityMeta = {
            id: String(community._id),
            name: community.name || "",
            slug: community.slug || "",
            logoUrl: community.logoUrl || "",
            coverUrl: community.coverUrl || "",
            isOwner,
            isMember,
          };
        }
      }

      // Auth OPTIONNELLE : savoir si l'utilisateur est inscrit
      let enrolled = false;
      if (userId) {
        enrolled = await isUserEnrolled(userId, course._id);
      }

      // Infos auteur
      let ownerName = "";
      let ownerAvatar = "";
      if (course.ownerId) {
        const owner = await User.findById(course.ownerId)
          .select({ fullName: 1, avatarUrl: 1 })
          .lean();
        ownerName = owner?.fullName || "";
        ownerAvatar = owner?.avatarUrl || "";
      }

      res.set("Cache-Control", "no-store");
      return res.json({
        ok: true,
        data: {
          ...course,
          id: String(course._id),
          visibility,
          ownerName,
          ownerAvatar,
          enrolled,
          // 🔹 meta communauté pour l'UI
          community: communityMeta,
        },
      });
    } catch (e) {
      console.error("[COURSES] public-read ERROR:", e?.stack || e);
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
