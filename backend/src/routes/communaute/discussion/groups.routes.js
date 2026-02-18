// backend/src/routes/communaute/discussion/groups.routes.js
const {
  requireAuth,
  buildAttachments,
  upload,
  CommunityGroup,
  CommunityGroupMember,
  CommunityDiscussionMessage,
  User,
} = require("./common");

const { createNotif, markNotifsSeen } = require("../../../utils/notifications");
const Notification = require("../../../models/notification.model");

module.exports = (router) => {
  /* =========================================================
     2) DISCUSSIONS DE GROUPE (infos groupe)
     GET /api/communaute/discussions/groups/:groupId
  =========================================================*/
  router.get("/groups/:groupId", requireAuth, async (req, res) => {
    const { groupId } = req.params;
    const userId = String(req.auth.userId);

    try {
      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      })
        .populate({ path: "community", select: "name ownerId" })
        .lean();

      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      const community = group.community;
      const ownerId = community?.ownerId
        ? String(community.ownerId)
        : String(group.owner);

      // 👇 admin = owner du groupe OU owner de la communauté
      const isAdmin = ownerId === userId;

      let isAllowed = isAdmin;

      if (!isAllowed) {
        const gm = await CommunityGroupMember.findOne({
          group: group._id,
          user: userId,
          leftAt: null,
        }).lean();
        isAllowed = !!gm;
      }

      if (!isAllowed) {
        return res.status(403).json({
          ok: false,
          error:
            "Tu dois être membre de ce groupe pour accéder à la discussion.",
        });
      }

      const groupMembers = await CommunityGroupMember.find({
        group: group._id,
        leftAt: null,
      })
        .select({ user: 1 })
        .lean();

      const userIds = [...new Set(groupMembers.map((m) => String(m.user)))];

      const users = await User.find({ _id: { $in: userIds } })
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();

      const mapUsers = new Map(users.map((u) => [String(u._id), u]));

      const members = groupMembers.map((m) => {
        const u = mapUsers.get(String(m.user));
        return {
          userId: String(m.user),
          fullName: u?.fullName || "",
          avatarUrl: u?.avatarUrl || null,
        };
      });

      const membersCount = members.length;

      return res.json({
        ok: true,
        data: {
          group: {
            id: String(group._id),
            communityId: String(group.community?._id || group.community),
            name: group.name || "Groupe sans nom",
            accessType: group.accessType === "course" ? "course" : "free",
            coverUrl: group.coverUrl || null,
            createdAt: group.createdAt?.toISOString?.() || null,
            communityName: community?.name || null,

            // 👇 déjà présent avant
            isAdmin,
            membersCount,

            // 👇 NOUVEAU : état du verrouillage
            onlyAdminsCanPost: !!group.onlyAdminsCanPost,
          },
          members,
        },
      });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] groups/:groupId ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les informations du groupe.",
      });
    }
  });

  /* =========================================================
     3) PARAMÈTRES D’ENVOI DE MESSAGES (LOCK GROUPE)
     FRONT : PATCH /api/communaute/discussions/groups/:groupId/settings
     body: { onlyAdminsCanPost: boolean }
  =========================================================*/

  async function updateGroupPostingSettings(req, res) {
    const { groupId } = req.params;
    const userId = String(req.auth.userId);
    const { onlyAdminsCanPost } = req.body || {};

    try {
      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      })
        .populate({ path: "community", select: "ownerId" })
        .select({ owner: 1, community: 1, onlyAdminsCanPost: 1 })
        .lean();

      if (!group) {
        return res
          .status(404)
          .json({ ok: false, error: "Groupe introuvable." });
      }

      const community = group.community;
      const ownerId = community?.ownerId
        ? String(community.ownerId)
        : String(group.owner);

      const isAdmin = ownerId === userId;

      if (!isAdmin) {
        return res.status(403).json({
          ok: false,
          error:
            "Seul l’administrateur peut modifier les paramètres de discussion.",
        });
      }

      const nextValue = !!onlyAdminsCanPost;

      await CommunityGroup.updateOne(
        { _id: groupId },
        { $set: { onlyAdminsCanPost: nextValue } },
      );

      return res.json({
        ok: true,
        data: {
          onlyAdminsCanPost: nextValue,
        },
      });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] PATCH groups/:groupId/settings ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error:
          "Impossible de mettre à jour les paramètres de discussion du groupe.",
      });
    }
  }

  // 👉 Nouveau chemin qui correspond EXACTEMENT à ce que le front appelle
  router.patch(
    "/groups/:groupId/settings",
    requireAuth,
    updateGroupPostingSettings,
  );

  // 👉 Ancien chemin conservé (optionnel, pour compatibilité si tu l’utilises ailleurs)
  router.patch(
    "/groups/:groupId/settings/posting",
    requireAuth,
    updateGroupPostingSettings,
  );

  /* =========================================================
     5) MESSAGES DE GROUPE
     GET  /api/communaute/discussions/groups/:groupId/messages
     POST /api/communaute/discussions/groups/:groupId/messages
  =========================================================*/

  router.get("/groups/:groupId/messages", requireAuth, async (req, res) => {
    const { groupId } = req.params;
    const userId = String(req.auth.userId);

    try {
      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      })
        .populate({ path: "community", select: "ownerId" })
        .select({ owner: 1, community: 1, onlyAdminsCanPost: 1 })
        .lean();

      if (!group) {
        return res
          .status(404)
          .json({ ok: false, error: "Groupe introuvable." });
      }

      const community = group.community;
      const ownerId = community?.ownerId
        ? String(community.ownerId)
        : String(group.owner);

      let isAllowed = ownerId === userId;
      if (!isAllowed) {
        const gm = await CommunityGroupMember.findOne({
          group: group._id,
          user: userId,
          leftAt: null,
        }).lean();
        isAllowed = !!gm;
      }

      if (!isAllowed) {
        return res.status(403).json({
          ok: false,
          error: "Tu dois être membre de ce groupe pour voir les messages.",
        });
      }

      const threadKey = `group_${groupId}`;

      const docs = await CommunityDiscussionMessage.find({
        threadKey,
        type: "group",
      })
        .sort({ createdAt: 1 })
        .lean();

      const authorIds = [...new Set(docs.map((d) => String(d.authorId)))];
      const authors = await User.find({ _id: { $in: authorIds } })
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();

      const mapUsers = new Map(authors.map((u) => [String(u._id), u]));

      const items = docs.map((d) => {
        const u = mapUsers.get(String(d.authorId));
        return {
          id: String(d._id),
          authorId: String(d.authorId),
          authorName: u?.fullName || "",
          authorAvatar: u?.avatarUrl || null,
          body: d.body || "",
          createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
          mine: String(d.authorId) === userId,
          attachments: d.attachments || [],
        };
      });

      // 👉 quand il ouvre la discussion de groupe, on marque ses notifs "discussion_message" pour ce thread comme vues
      await markNotifsSeen(userId, [], {
        kind: "discussion_message",
        "payload.threadKey": threadKey,
      });

      return res.json({
        ok: true,
        data: {
          items,
          // 👇 on renvoie l’état du verrouillage au passage (utile si tu veux l’exploiter ici)
          onlyAdminsCanPost: !!group.onlyAdminsCanPost,
        },
      });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] GET groups/:groupId/messages ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les messages du groupe.",
      });
    }
  });

  router.post(
    "/groups/:groupId/messages",
    requireAuth,
    upload.array("files", 10),
    async (req, res) => {
      const { groupId } = req.params;
      const userId = String(req.auth.userId);

      const body = (req.body?.body || "").trim();
      const files = Array.isArray(req.files) ? req.files : [];

      const hasText = body.length > 0;
      const hasFiles = files.length > 0;

      if (!hasText && !hasFiles) {
        return res.status(400).json({
          ok: false,
          error: "Le message ne peut pas être vide.",
        });
      }

      try {
        const group = await CommunityGroup.findOne({
          _id: groupId,
          deletedAt: null,
        })
          .populate({ path: "community", select: "ownerId" })
          .select({ owner: 1, community: 1, onlyAdminsCanPost: 1 })
          .lean();

        if (!group) {
          return res
            .status(404)
            .json({ ok: false, error: "Groupe introuvable." });
        }

        const community = group.community;
        const ownerId = community?.ownerId
          ? String(community.ownerId)
          : String(group.owner);

        const isAdmin = ownerId === userId;

        let isAllowed = isAdmin;
        if (!isAllowed) {
          const gm = await CommunityGroupMember.findOne({
            group: group._id,
            user: userId,
            leftAt: null,
          }).lean();
          isAllowed = !!gm;
        }

        if (!isAllowed) {
          return res.status(403).json({
            ok: false,
            error: "Tu dois être membre de ce groupe pour envoyer un message.",
          });
        }

        // 🔴 Blocage si le groupe est verrouillé et que l'utilisateur n'est pas admin
        if (group.onlyAdminsCanPost && !isAdmin) {
          return res.status(403).json({
            ok: false,
            error:
              "Les discussions sont verrouillées. Seuls les administrateurs peuvent envoyer des messages.",
          });
        }

        const threadKey = `group_${groupId}`;

        const attachments = await buildAttachments(files);

        const msg = await CommunityDiscussionMessage.create({
          threadKey,
          type: "group",
          authorId: userId,
          body,
          attachments,
        });

        // 🔔 Notifs pour les membres du groupe (sauf l'auteur)
        try {
          const groupMembers = await CommunityGroupMember.find({
            group: group._id,
            leftAt: null,
          })
            .select({ user: 1 })
            .lean();

          const recipientIds = new Set(groupMembers.map((m) => String(m.user)));
          // On ajoute aussi le owner pour être sûr qu'il reçoit (si pas déjà membre)
          recipientIds.add(ownerId);

          const communityId = String(
            group.community?._id || group.community || "",
          );

          for (const rid of recipientIds) {
            if (!rid || rid === userId) continue;
            await createNotif({
              userId: rid,
              kind: "discussion_message",
              communityId: communityId || null,
              payload: {
                threadKey,
                type: "group",
                groupId: String(group._id),
                communityId: communityId || null,
                // 🔗 on associe explicitement la notif à ce message
                messageId: String(msg._id),
              },
            });
          }
        } catch (e) {
          console.error(
            "[DISCUSSIONS] groups messages notif failed:",
            e?.message || e,
          );
        }

        return res.json({
          ok: true,
          data: {
            items: [
              {
                id: String(msg._id),
                authorId: userId,
                authorName: "",
                authorAvatar: null,
                body: msg.body,
                createdAt: msg.createdAt.toISOString(),
                mine: true,
                attachments,
              },
            ],
          },
        });
      } catch (e) {
        console.error(
          "[DISCUSSIONS] POST groups/:groupId/messages ERROR:",
          e?.stack || e?.message || e,
        );
        return res.status(500).json({
          ok: false,
          error: "Impossible d’envoyer le message.",
        });
      }
    },
  );

  /* =========================================================
     DELETE /api/communaute/discussions/groups/:groupId/messages/:messageId
     -> suppression d'un message de groupe par son auteur OU l'administrateur
  =========================================================*/
  router.delete(
    "/groups/:groupId/messages/:messageId",
    requireAuth,
    async (req, res) => {
      const { groupId, messageId } = req.params;
      const userId = String(req.auth.userId);

      try {
        // Vérifie que le groupe existe et que l'utilisateur a accès
        const group = await CommunityGroup.findOne({
          _id: groupId,
          deletedAt: null,
        })
          .populate({ path: "community", select: "ownerId" })
          .select({ owner: 1, community: 1 })
          .lean();

        if (!group) {
          return res
            .status(404)
            .json({ ok: false, error: "Groupe introuvable." });
        }

        const community = group.community;
        const ownerId = community?.ownerId
          ? String(community.ownerId)
          : String(group.owner);

        // ✅ Identification de l'administrateur
        const isAdmin = ownerId === userId;

        let isAllowed = isAdmin;
        if (!isAllowed) {
          const gm = await CommunityGroupMember.findOne({
            group: group._id,
            user: userId,
            leftAt: null,
          }).lean();
          isAllowed = !!gm;
        }

        if (!isAllowed) {
          return res.status(403).json({
            ok: false,
            error: "Tu dois être membre de ce groupe pour gérer les messages.",
          });
        }

        const threadKey = `group_${groupId}`;

        const msg = await CommunityDiscussionMessage.findOne({
          _id: messageId,
          threadKey,
          type: "group",
        });

        if (!msg) {
          return res
            .status(404)
            .json({ ok: false, error: "Message introuvable." });
        }

        // ✅ MODIFICATION : Autoriser la suppression si l'utilisateur est l'auteur OU l'administrateur
        const isAuthor = String(msg.authorId) === userId;
        if (!isAuthor && !isAdmin) {
          return res.status(403).json({
            ok: false,
            error: "Tu n'as pas l'autorisation de supprimer ce message.",
          });
        }

        await msg.deleteOne();

        // 🔔 Quand le message est supprimé, on marque les notifs liées à CE message comme vues
        try {
          await Notification.updateMany(
            {
              kind: "discussion_message",
              seen: false,
              "payload.threadKey": threadKey,
              "payload.messageId": String(messageId),
            },
            { $set: { seen: true } },
          );
        } catch (err) {
          console.error(
            "[DISCUSSIONS] mark discussion_message notifs seen on delete (group) failed:",
            err?.message || err,
          );
        }

        return res.json({ ok: true });
      } catch (e) {
        console.error(
          "[DISCUSSIONS] DELETE groups/:groupId/messages/:messageId ERROR:",
          e?.stack || e?.message || e,
        );
        return res.status(500).json({
          ok: false,
          error: "Impossible de supprimer le message.",
        });
      }
    },
  );
};
