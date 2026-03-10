// backend/src/routes/communaute/groups/join.js
const {
  clampStr,
  requireAuth,
  makeRid,
  CommunityGroup,
  CommunityGroupMember,
} = require("./_shared");

const CourseEnrollment = require("../../../models/courseEnrollment.model");
const CommunityMember = require("../../../models/communityMember.model");

/**
 * POST /api/communaute/groups/:id/join
 */
module.exports = (router) => {
  router.post("/:id/join", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const userId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      });

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      // 👑 Le créateur est toujours considéré comme membre
      if (String(group.owner) === String(userId)) {
        return res.status(400).json({
          ok: false,
          error:
            "Tu es le créateur de ce groupe : tu es déjà considéré comme membre.",
        });
      }

      // 🔎 ID de la communauté parente
      const communityId = group.community || group.communityId;

      // 🧱 RÈGLE : il faut être membre **actif** de la communauté
      const communityMember = await CommunityMember.findOne({
        communityId: communityId,
        userId: userId,
        status: "active",
      });

      console.log("[GROUPS] membership check =>", {
        rid,
        communityId: String(communityId),
        userId: String(userId),
        found: !!communityMember,
      });

      if (!communityMember) {
        return res.status(400).json({
          ok: false,
          error: "COMMUNITY_MEMBERSHIP_REQUIRED",
          message:
            "Tu dois d’abord rejoindre la communauté pour accéder à ce groupe.",
        });
      }

      // 🔎 membership groupe
      let membership = await CommunityGroupMember.findOne({
        group: group._id,
        user: userId,
      });

      const everMember = !!membership;

      // 🔐 Si groupe lié à une formation ET user jamais membre → vérifier l'inscription
      if (group.accessType === "course" && !everMember) {
        if (!group.courseId) {
          return res.status(400).json({
            ok: false,
            error: "COURSE_REQUIRED",
            message:
              "Ce groupe est lié à une formation, mais aucune formation n’est configurée.",
          });
        }

        const enrolled = await CourseEnrollment.exists({
          userId,
          courseId: group.courseId,
        });

        if (!enrolled) {
          return res.status(400).json({
            ok: false,
            error: "COURSE_REQUIRED",
            message:
              "Tu dois d’abord t’inscrire à cette formation pour rejoindre ce groupe.",
          });
        }
      }

      // ✅ À partir d’ici : communauté OK, formation OK (si besoin) → on le laisse entrer.

      if (!membership) {
        membership = await CommunityGroupMember.create({
          group: group._id,
          user: userId,
          joinedAt: new Date(),
          leftAt: null,
        });
      } else if (membership.leftAt !== null) {
        // l'utilisateur revient dans le groupe → on le remet actif
        membership.leftAt = null;
        membership.joinedAt = new Date();
        await membership.save();
      }

      const membersCount = await CommunityGroupMember.countDocuments({
        group: group._id,
        leftAt: null,
      });

      return res.status(200).json({
        ok: true,
        data: {
          isMember: true,
          membersCount,
          isOwner: false,
          canToggle: true,
          everMember: true,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] POST /groups/:id/join ERROR: ${e?.stack || e}`
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de rejoindre le groupe",
      });
    }
  });
};
