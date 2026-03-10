// backend/src/routes/communaute/groups/leave.js
const {
  clampStr,
  requireAuth,
  makeRid,
  CommunityGroup,
  CommunityGroupMember,
} = require("./_shared");

/**
 * POST /api/communaute/groups/:id/leave
 */
module.exports = (router) => {
  router.post("/:id/leave", requireAuth, async (req, res) => {
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

      if (String(group.owner) === String(userId)) {
        return res.status(400).json({
          ok: false,
          error:
            "Tu es le créateur de ce groupe : tu ne peux pas le quitter sans le transférer ou le supprimer.",
        });
      }

      const membership = await CommunityGroupMember.findOne({
        group: group._id,
        user: userId,
      });

      if (membership && membership.leftAt === null) {
        membership.leftAt = new Date();
        await membership.save();
      }

      const membersCount = await CommunityGroupMember.countDocuments({
        group: group._id,
        leftAt: null,
      });

      const everMember = !!membership;

      return res.status(200).json({
        ok: true,
        data: {
          isMember: false,
          membersCount,
          isOwner: false,
          canToggle: true,
          everMember,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] POST /groups/:id/leave ERROR: ${e?.stack || e}`
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de quitter le groupe",
      });
    }
  });
};
