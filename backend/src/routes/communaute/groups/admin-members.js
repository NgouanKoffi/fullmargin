// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\groups\admin-members.js
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

// Vérifie que l'appelant est bien owner de la communauté ou du groupe
async function assertGroupAdmin({ group, callerId }) {
  if (!group || !callerId) {
    return { ok: false, error: "Données invalides" };
  }

  // owner du groupe = OK
  if (String(group.owner) === String(callerId)) {
    return { ok: true };
  }

  // sinon, on check l'owner de la communauté
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
  /**
   * POST /api/communaute/groups/:id/admin-add-member
   *
   * body: { userId }
   *
   * ➜ Le propriétaire de la communauté (ou du groupe) peut ajouter
   *    n’importe quel utilisateur dans le groupe, même si le groupe
   *    est lié à une formation.
   *    On s’assure simplement qu’il est aussi membre ACTIF de la communauté
   *    (on crée/rafraîchit CommunityMember si besoin).
   */
  router.post("/:id/admin-add-member", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const adminId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);
      const { userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({
          ok: false,
          error: "userId requis pour ajouter un membre",
        });
      }

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      // 🔐 Vérifier que l’appelant est bien admin (owner groupe ou communauté)
      const checkAdmin = await assertGroupAdmin({
        group,
        callerId: adminId,
      });
      if (!checkAdmin.ok) {
        return res
          .status(403)
          .json({ ok: false, error: checkAdmin.error || "Interdit" });
      }

      // Vérifier que l'utilisateur cible existe
      const targetUser = await User.findOne({ _id: userId })
        .select({ fullName: 1 })
        .lean();
      if (!targetUser) {
        return res.status(404).json({
          ok: false,
          error: "Utilisateur cible introuvable",
        });
      }

      const communityId = group.community;

      // 🧱 S’assurer que le user est membre ACTIF de la communauté
      if (communityId) {
        await CommunityMember.updateOne(
          {
            communityId,
            userId,
          },
          {
            $set: {
              status: "active",
              leftAt: null,
            },
          },
          { upsert: true }
        );
      }

      // 🔵 Créer / réactiver l’entrée dans CommunityGroupMember
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

      // 🔔 Notif au user : "on t’a ajouté dans un groupe"
      try {
        await createNotif({
          userId,
          kind: "group_manual_add_member",
          communityId: communityId ? String(communityId) : null,
          groupId: group._id,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            byUserId: String(adminId),
          },
        });

        // 🔔 Notif à l’admin : "tu as ajouté X dans le groupe"
        await createNotif({
          userId: adminId,
          kind: "group_admin_add_member",
          communityId: communityId ? String(communityId) : null,
          groupId: group._id,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            targetUserId: String(userId),
            targetFullName: targetUser.fullName || "",
          },
        });
      } catch (e) {
        console.error(
          `[GROUPS ${rid}] admin-add-member notif ERROR:`,
          e?.message || e
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
        e?.stack || e
      );
      return res.status(500).json({
        ok: false,
        error: "Ajout manuel au groupe impossible",
      });
    }
  });

  /**
   * POST /api/communaute/groups/:id/admin-remove-member
   *
   * body: { userId }
   *
   * ➜ Le propriétaire peut retirer un user d’un groupe (soft leave).
   */
  router.post("/:id/admin-remove-member", requireAuth, async (req, res) => {
    const rid = makeRid(req);

    try {
      const adminId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);
      const { userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({
          ok: false,
          error: "userId requis pour retirer un membre",
        });
      }

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      }).lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      // 🔐 Vérifier admin
      const checkAdmin = await assertGroupAdmin({
        group,
        callerId: adminId,
      });
      if (!checkAdmin.ok) {
        return res
          .status(403)
          .json({ ok: false, error: checkAdmin.error || "Interdit" });
      }

      // On récupère le user pour pouvoir mettre son nom dans la notif admin
      const targetUser = await User.findOne({ _id: userId })
        .select({ fullName: 1 })
        .lean();

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

      // 🔔 Notif au user : "on t’a retiré du groupe"
      try {
        await createNotif({
          userId,
          kind: "group_manual_remove_member",
          communityId: group.community ? String(group.community) : null,
          groupId: group._id,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            byUserId: String(adminId),
          },
        });

        // 🔔 Notif à l’admin : "tu as retiré X du groupe"
        await createNotif({
          userId: adminId,
          kind: "group_admin_remove_member",
          communityId: group.community ? String(group.community) : null,
          groupId: group._id,
          payload: {
            groupId: String(group._id),
            groupName: group.name || "Groupe",
            targetUserId: String(userId),
            targetFullName: targetUser?.fullName || "",
          },
        });
      } catch (e) {
        console.error(
          `[GROUPS ${rid}] admin-remove-member notif ERROR:`,
          e?.message || e
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
        e?.stack || e
      );
      return res.status(500).json({
        ok: false,
        error: "Retrait manuel du groupe impossible",
      });
    }
  });

  /**
   * GET /api/communaute/groups/:id/admin-membership?userId=xxx
   *
   * ➜ Pour que le front sache si un user donné est déjà membre du groupe
   *    (afficher "Ajouter" ou "Retirer").
   */
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

      // 🔐 Vérifier admin
      const checkAdmin = await assertGroupAdmin({
        group,
        callerId: adminId,
      });
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
        e?.stack || e
      );
      return res.status(500).json({
        ok: false,
        error: "Lecture du statut membre impossible",
      });
    }
  });
};
