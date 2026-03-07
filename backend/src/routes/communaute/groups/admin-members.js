// backend/src/routes/communaute/groups/admin-members.js
const {
  clampStr,
  requireAuth,
  makeRid,
  Community,
  CommunityGroup,
  CommunityGroupMember,
  CommunityMember,
} = require("./_shared");

const User = require("../../../models/user.model");
const { createNotif } = require("../../../utils/notifications");

/**
 * Helpers
 */

async function assertGroupAdmin({ group, callerId }) {
  if (!group || !callerId) {
    return { ok: false, error: "Données invalides" };
  }

  if (String(group.owner) === String(callerId)) {
    return { ok: true };
  }

  const community = await Community.findOne({
    _id: group.community,
    deletedAt: null,
  })
    .select({ ownerId: 1 })
    .lean();

  if (!community) {
    return { ok: false, error: "Communauté introuvable" };
  }

  if (String(community.ownerId) !== String(callerId)) {
    return { ok: false, error: "Interdit" };
  }

  return { ok: true, community };
}

module.exports = (router) => {
  router.post("/:id/admin-add-member", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const adminId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);
      const { userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId requis" });
      }

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      const checkAdmin = await assertGroupAdmin({ group, callerId: adminId });
      if (!checkAdmin.ok) {
        return res
          .status(403)
          .json({ ok: false, error: checkAdmin.error || "Interdit" });
      }

      const targetUser = await User.findOne({ _id: userId })
        .select({ fullName: 1 })
        .lean();
      if (!targetUser) {
        return res
          .status(404)
          .json({ ok: false, error: "Utilisateur cible introuvable" });
      }

      const communityId = group.community;
      let communityName = "";

      if (communityId) {
        const comm = await Community.findById(communityId)
          .select("name")
          .lean();
        if (comm) communityName = comm.name;

        await CommunityMember.updateOne(
          { communityId, userId },
          { $set: { status: "active", leftAt: null } },
          { upsert: true },
        );
      }

      let membership = await CommunityGroupMember.findOne({
        group: group._id,
        user: userId,
      });

      if (!membership) {
        membership = await CommunityGroupMember.create({
          group: group._id,
          user: userId,
          joinedAt: new Date(),
          leftAt: null,
        });
      } else if (membership.leftAt !== null) {
        membership.leftAt = null;
        membership.joinedAt = new Date();
        await membership.save();
      }

      const membersCount = await CommunityGroupMember.countDocuments({
        group: group._id,
        leftAt: null,
      });

      try {
        // 🔔 Notif UNIQUEMENT au user : "on t’a ajouté dans un groupe"
        await createNotif({
          userId,
          kind: "group_manual_add_member",
          communityId: communityId ? String(communityId) : null,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            communityName,
            byUserId: String(adminId),
          },
        });
      } catch (e) {
        console.error(
          `[GROUPS ${rid}] admin-add-member notif ERROR:`,
          e?.message || e,
        );
      }

      return res.status(200).json({
        ok: true,
        data: {
          groupId: String(group._id),
          userId: String(userId),
          isMember: true,
          membersCount,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] POST /groups/:id/admin-add-member ERROR:`,
        e?.stack || e,
      );
      return res
        .status(500)
        .json({ ok: false, error: "Ajout manuel au groupe impossible" });
    }
  });

  router.post("/:id/admin-remove-member", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const adminId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);
      const { userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId requis" });
      }

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      const checkAdmin = await assertGroupAdmin({ group, callerId: adminId });
      if (!checkAdmin.ok) {
        return res
          .status(403)
          .json({ ok: false, error: checkAdmin.error || "Interdit" });
      }

      const communityId = group.community;
      let communityName = "";

      if (communityId) {
        const comm = await Community.findById(communityId)
          .select("name")
          .lean();
        if (comm) communityName = comm.name;
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

      try {
        // 🔔 Notif UNIQUEMENT au user : "on t’a retiré du groupe"
        await createNotif({
          userId,
          kind: "group_manual_remove_member",
          communityId: communityId ? String(communityId) : null,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            communityName,
            byUserId: String(adminId),
          },
        });
      } catch (e) {
        console.error(
          `[GROUPS ${rid}] admin-remove-member notif ERROR:`,
          e?.message || e,
        );
      }

      return res.status(200).json({
        ok: true,
        data: {
          groupId: String(group._id),
          userId: String(userId),
          isMember: false,
          membersCount,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] POST /groups/:id/admin-remove-member ERROR:`,
        e?.stack || e,
      );
      return res
        .status(500)
        .json({ ok: false, error: "Retrait manuel du groupe impossible" });
    }
  });

  router.get("/:id/admin-membership", requireAuth, async (req, res) => {
    const rid = makeRid(req);
    try {
      const adminId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);
      const userId = clampStr(req.query.userId || "", 80);

      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId requis" });
      }

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      const checkAdmin = await assertGroupAdmin({ group, callerId: adminId });
      if (!checkAdmin.ok) {
        return res
          .status(403)
          .json({ ok: false, error: checkAdmin.error || "Interdit" });
      }

      const membership = await CommunityGroupMember.findOne({
        group: group._id,
        user: userId,
      }).lean();

      const everMember = !!membership;
      const isMember = !!membership && membership.leftAt === null;

      const membersCount = await CommunityGroupMember.countDocuments({
        group: group._id,
        leftAt: null,
      });

      return res.status(200).json({
        ok: true,
        data: {
          userId: String(userId),
          groupId: String(group._id),
          isMember,
          everMember,
          membersCount,
        },
      });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] GET /groups/:id/admin-membership ERROR:`,
        e?.stack || e,
      );
      return res
        .status(500)
        .json({ ok: false, error: "Lecture du statut membre impossible" });
    }
  });
};
