const {
  clampStr,
  requireAuth,
  makeRid,
  CommunityGroup,
  CommunityGroupMember,
} = require("./_shared");

const CourseEnrollment = require("../../../models/courseEnrollment.model");
const Course = require("../../../models/course.model");

/**
 * GET /api/communaute/groups/:id/membership
 */
module.exports = (router) => {
  router.get("/:id/membership", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const userId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      const isOwner = String(group.owner) === String(userId);

      const membersCount = await CommunityGroupMember.countDocuments({
        group: group._id,
        leftAt: null,
      });

      // 🔗 Infos sur la formation liée
      const courseId =
        group.accessType === "course" && group.courseId
          ? String(group.courseId)
          : null;

      let courseTitle = null;
      if (courseId) {
        const course = await Course.findOne({
          _id: group.courseId,
          deletedAt: null,
        })
          .select("title")
          .lean();
        if (course?.title) {
          courseTitle = course.title;
        }
      }

      // 🧠 Est-ce que l’utilisateur est inscrit à la formation ?
      let enrolledToCourse = false;
      if (courseId) {
        const enrolled = await CourseEnrollment.exists({
          userId,
          courseId: group.courseId,
        });
        enrolledToCourse = !!enrolled;
      }

      // 👑 Owner : toujours membre, pas de toggle join/leave
      if (isOwner) {
        return res.status(200).json({
          ok: true,
          data: {
            isMember: true,
            membersCount,
            isOwner: true,
            canToggle: false,
            everMember: true,
            enrolledToCourse,
            courseId,
            courseTitle,
          },
        });
      }

      // 🔎 Statut dans le groupe
      const membership = await CommunityGroupMember.findOne({
        group: group._id,
        user: userId,
      }).lean();

      const everMember = !!membership;
      const isMember = !!membership && membership.leftAt === null;

      // 🔐 Peut-il cliquer sur "Rejoindre / Quitter" ?
      let canToggle = true;

      if (isMember) {
        // Membre actif → peut quitter
        canToggle = true;
      } else if (group.accessType === "free") {
        // Groupe libre → peut tenter de rejoindre
        canToggle = true;
      } else if (group.accessType === "course") {
        if (everMember) {
          // Il a déjà été dans le groupe une fois → on le laisse revenir
          canToggle = true;
        } else {
          // Jamais membre → on autorise uniquement s’il est inscrit à la formation
          if (!courseId) {
            // Mauvaise config : groupe "course" sans courseId
            canToggle = false;
          } else {
            canToggle = enrolledToCourse;
          }
        }
      }

      return res.status(200).json({
        ok: true,
        data: {
          isMember,
          membersCount,
          isOwner: false,
          canToggle,
          everMember,
          enrolledToCourse,
          courseId,
          courseTitle,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] GET /groups/:id/membership ERROR: ${e?.stack || e}`
      );
      return res.status(500).json({
        ok: false,
        error: "Lecture du statut d’adhésion impossible",
      });
    }
  });
};
