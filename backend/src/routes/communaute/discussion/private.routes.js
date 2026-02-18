// backend/src/routes/communaute/discussion/private.routes.js
const {
  requireAuth,
  getCommunityOr404,
  buildAttachments,
  upload,
  Community,
  CommunityMember,
  CommunityPrivateThread,
  CommunityDiscussionMessage,
  User,
} = require("./common");

const { createNotif, markNotifsSeen } = require("../../../utils/notifications");
const Notification = require("../../../models/notification.model");

module.exports = (router) => {
  /* =========================================================
     1) DISCUSSIONS PRIVÉES ADMIN ⇄ MEMBRE
     POST /api/communaute/discussions/private/ensure
  =========================================================*/
  router.post("/private/ensure", requireAuth, async (req, res) => {
    const { communityId } = req.body || {};
    if (!communityId) {
      return res
        .status(400)
        .json({ ok: false, error: "communityId requis dans le body" });
    }

    const c = await getCommunityOr404(communityId, res);
    if (!c) return;

    const userId = String(req.auth.userId);
    const ownerId = String(c.ownerId);

    if (userId === ownerId) {
      return res.status(400).json({
        ok: false,
        error:
          "Le propriétaire de la communauté n'a pas de discussion privée automatique avec lui-même.",
      });
    }

    try {
      const membership = await CommunityMember.findOne({
        communityId,
        userId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }).lean();

      if (!membership) {
        return res.status(403).json({
          ok: false,
          error:
            "Tu dois être membre de la communauté pour ouvrir une discussion privée avec l'administrateur.",
        });
      }

      const thread = await CommunityPrivateThread.findOneAndUpdate(
        {
          communityId,
          ownerId,
          memberId: userId,
        },
        {
          $setOnInsert: {
            communityId,
            ownerId,
            memberId: userId,
            lastMessageAt: new Date(),
          },
        },
        { new: true, upsert: true },
      ).lean();

      const [ownerUser, memberUser] = await Promise.all([
        User.findById(ownerId).select({ fullName: 1, avatarUrl: 1 }).lean(),
        User.findById(userId).select({ fullName: 1, avatarUrl: 1 }).lean(),
      ]);

      return res.json({
        ok: true,
        data: {
          thread: {
            id: String(thread._id),
            communityId: String(thread.communityId),
            ownerId: String(thread.ownerId),
            memberId: String(thread.memberId),
            lastMessageAt: thread.lastMessageAt,
            communityName: c.name || "",
            ownerName: ownerUser?.fullName || "",
            ownerAvatar: ownerUser?.avatarUrl || null,
            memberName: memberUser?.fullName || "",
            memberAvatar: memberUser?.avatarUrl || null,
          },
        },
      });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] private/ensure ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de préparer la discussion privée.",
      });
    }
  });

  /* ---------------------------------------------------------
     GET /api/communaute/discussions/private/list
  ----------------------------------------------------------*/
  router.get("/private/list", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);

    try {
      const threads = await CommunityPrivateThread.find({
        $or: [{ ownerId: userId }, { memberId: userId }],
      })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .lean();

      const communityIds = [
        ...new Set(threads.map((t) => String(t.communityId))),
      ];
      const ownerIds = [...new Set(threads.map((t) => String(t.ownerId)))];
      const memberIds = [...new Set(threads.map((t) => String(t.memberId)))];

      const [communities, owners, members] = await Promise.all([
        Community.find({ _id: { $in: communityIds } })
          .select({ name: 1 })
          .lean(),
        User.find({ _id: { $in: ownerIds } })
          .select({ fullName: 1, avatarUrl: 1 })
          .lean(),
        User.find({ _id: { $in: memberIds } })
          .select({ fullName: 1, avatarUrl: 1 })
          .lean(),
      ]);

      const mapCommunity = new Map(communities.map((c) => [String(c._id), c]));
      const mapOwner = new Map(owners.map((u) => [String(u._id), u]));
      const mapMember = new Map(members.map((u) => [String(u._id), u]));

      const items = threads.map((t) => {
        const c = mapCommunity.get(String(t.communityId));
        const o = mapOwner.get(String(t.ownerId));
        const m = mapMember.get(String(t.memberId));

        const isOwner = String(t.ownerId) === userId;
        const peer = isOwner ? m : o;

        return {
          id: String(t._id),
          communityId: String(t.communityId),
          ownerId: String(t.ownerId),
          memberId: String(t.memberId),
          lastMessageAt: t.lastMessageAt,
          communityName: c?.name || "",
          peerUserId: peer ? String(peer._id) : null,
          peerName: peer?.fullName || "",
          peerAvatar: peer?.avatarUrl || null,
        };
      });

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] private/list ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de lister les discussions privées.",
      });
    }
  });

  /* =========================================================
     4) MESSAGES PRIVÉS
     GET  /api/communaute/discussions/private/:threadId/messages
     POST /api/communaute/discussions/private/:threadId/messages
     threadId = "priv_<communityId>_<memberId>"
  =========================================================*/

  router.get("/private/:threadId/messages", requireAuth, async (req, res) => {
    const { threadId } = req.params;
    const userId = String(req.auth.userId);

    try {
      if (!threadId.startsWith("priv_")) {
        return res.status(400).json({
          ok: false,
          error: "Identifiant de conversation invalide.",
        });
      }

      const parts = threadId.split("_");
      if (parts.length !== 3) {
        return res.status(400).json({
          ok: false,
          error: "Identifiant de conversation invalide.",
        });
      }

      const communityId = parts[1];
      const memberId = parts[2];

      const community = await Community.findOne({
        _id: communityId,
        deletedAt: null,
      })
        .select({ ownerId: 1 })
        .lean();

      if (!community) {
        return res
          .status(404)
          .json({ ok: false, error: "Communauté introuvable." });
      }

      const ownerId = String(community.ownerId);

      if (userId !== ownerId && userId !== memberId) {
        return res.status(403).json({
          ok: false,
          error: "Accès interdit à cette conversation privée.",
        });
      }

      const docs = await CommunityDiscussionMessage.find({
        threadKey: threadId,
        type: "private",
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

      // 👉 quand l'utilisateur ouvre la conversation privée, on marque les notifs "discussion_message" comme vues
      await markNotifsSeen(userId, [], {
        kind: "discussion_message",
        "payload.threadKey": threadId,
      });

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] GET private/:threadId/messages ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les messages de la conversation privée.",
      });
    }
  });

  router.post(
    "/private/:threadId/messages",
    requireAuth,
    upload.array("files", 10),
    async (req, res) => {
      const { threadId } = req.params;
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
        if (!threadId.startsWith("priv_")) {
          return res.status(400).json({
            ok: false,
            error: "Identifiant de conversation invalide.",
          });
        }

        const parts = threadId.split("_");
        if (parts.length !== 3) {
          return res.status(400).json({
            ok: false,
            error: "Identifiant de conversation invalide.",
          });
        }

        const communityId = parts[1];
        const memberId = parts[2];

        const community = await Community.findOne({
          _id: communityId,
          deletedAt: null,
        })
          .select({ ownerId: 1 })
          .lean();

        if (!community) {
          return res
            .status(404)
            .json({ ok: false, error: "Communauté introuvable." });
        }

        const ownerId = String(community.ownerId);

        if (userId !== ownerId && userId !== memberId) {
          return res.status(403).json({
            ok: false,
            error: "Accès interdit à cette conversation privée.",
          });
        }

        const attachments = await buildAttachments(files);

        const msg = await CommunityDiscussionMessage.create({
          threadKey: threadId,
          type: "private",
          authorId: userId,
          body,
          attachments,
        });

        // 🔁 on met à jour le lastMessageAt du thread (si il existe)
        try {
          await CommunityPrivateThread.findOneAndUpdate(
            {
              communityId,
              ownerId,
              memberId,
            },
            { $set: { lastMessageAt: msg.createdAt } },
          );
        } catch (e) {
          console.error(
            "[DISCUSSIONS] private update lastMessageAt failed:",
            e?.message || e,
          );
        }

        // 🔔 on crée une notif pour l'autre participant
        const isSenderOwner = userId === ownerId;
        const recipientId = isSenderOwner ? memberId : ownerId;

        if (recipientId && recipientId !== userId) {
          try {
            await createNotif({
              userId: recipientId,
              kind: "discussion_message",
              communityId,
              payload: {
                threadKey: threadId,
                type: "private",
                communityId,
                ownerId,
                memberId,
                // 🔗 on associe la notif à ce message privé
                messageId: String(msg._id),
              },
            });
          } catch (e) {
            console.error(
              "[DISCUSSIONS] private notif failed:",
              e?.stack || e?.message || e,
            );
            // très important : on NE relance pas l'erreur
            // le message est bien envoyé même si la notif échoue
          }
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
          "[DISCUSSIONS] POST private/:threadId/messages ERROR:",
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
     DELETE /api/communaute/discussions/private/:threadId/messages/:messageId
     -> suppression d'un message privé par son auteur
  =========================================================*/
  router.delete(
    "/private/:threadId/messages/:messageId",
    requireAuth,
    async (req, res) => {
      const { threadId, messageId } = req.params;
      const userId = String(req.auth.userId);

      try {
        if (!threadId.startsWith("priv_")) {
          return res.status(400).json({
            ok: false,
            error: "Identifiant de conversation invalide.",
          });
        }

        const parts = threadId.split("_");
        if (parts.length !== 3) {
          return res.status(400).json({
            ok: false,
            error: "Identifiant de conversation invalide.",
          });
        }

        const communityId = parts[1];
        const memberId = parts[2];

        const community = await Community.findOne({
          _id: communityId,
          deletedAt: null,
        })
          .select({ ownerId: 1 })
          .lean();

        if (!community) {
          return res
            .status(404)
            .json({ ok: false, error: "Communauté introuvable." });
        }

        const ownerId = String(community.ownerId);

        if (userId !== ownerId && userId !== memberId) {
          return res.status(403).json({
            ok: false,
            error: "Accès interdit à cette conversation privée.",
          });
        }

        const msg = await CommunityDiscussionMessage.findOne({
          _id: messageId,
          threadKey: threadId,
          type: "private",
        });

        if (!msg) {
          return res
            .status(404)
            .json({ ok: false, error: "Message introuvable." });
        }

        if (String(msg.authorId) !== userId) {
          return res.status(403).json({
            ok: false,
            error: "Tu ne peux supprimer que tes propres messages.",
          });
        }

        await msg.deleteOne();

        // 🔔 Quand le message privé est supprimé, on marque les notifs liées à CE message comme vues
        try {
          await Notification.updateMany(
            {
              kind: "discussion_message",
              seen: false,
              "payload.threadKey": threadId,
              "payload.messageId": String(messageId),
            },
            { $set: { seen: true } },
          );
        } catch (err) {
          console.error(
            "[DISCUSSIONS] mark discussion_message notifs seen on delete (private) failed:",
            err?.message || err,
          );
        }

        return res.json({ ok: true });
      } catch (e) {
        console.error(
          "[DISCUSSIONS] DELETE private/:threadId/messages/:messageId ERROR:",
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
