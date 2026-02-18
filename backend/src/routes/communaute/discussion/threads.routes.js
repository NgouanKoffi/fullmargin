// backend/src/routes/communaute/discussion/threads.routes.js
const Notification = require("../../../models/notification.model");
// ✅ IMPÉRATIF : On importe le modèle des messages pour lire les vraies dates
const { CommunityDiscussionMessage } = require("./common");

module.exports = (router, deps) => {
  const {
    requireAuth,
    Community,
    CommunityMember,
    CommunityGroup,
    CommunityGroupMember,
    User,
  } = deps;

  /* =========================================================
     3) THREADS POUR LE PANNEAU MESSAGES (PRIVÉS + GROUPES)
     GET /api/communaute/discussions/threads
  =========================================================*/
  router.get("/threads", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50),
    );

    try {
      // 1️⃣ --- RÉCUPÉRATION DES LISTES (Adhésions) ---

      // A) PRIVÉS : je suis MEMBRE
      const myMemberships = await CommunityMember.find({
        userId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ communityId: 1, createdAt: 1, updatedAt: 1 })
        .lean();

      const communityIdsAsMember = [
        ...new Set(myMemberships.map((r) => String(r.communityId))),
      ];

      const communitiesAsMember = await Community.find({
        _id: { $in: communityIdsAsMember },
        deletedAt: null,
      })
        .select({ name: 1, ownerId: 1, logoUrl: 1 })
        .lean();

      const ownerIdsFromMemberSide = [
        ...new Set(communitiesAsMember.map((c) => String(c.ownerId))),
      ];

      const ownersFromMemberSide = await User.find({
        _id: { $in: ownerIdsFromMemberSide },
      })
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();

      const mapCommunitiesAsMember = new Map(
        communitiesAsMember.map((c) => [String(c._id), c]),
      );
      const mapOwnersFromMemberSide = new Map(
        ownersFromMemberSide.map((u) => [String(u._id), u]),
      );

      const privateItemsAsMember = myMemberships
        .map((m) => {
          const c = mapCommunitiesAsMember.get(String(m.communityId));
          if (!c) return null;
          if (String(c.ownerId) === userId) return null; // Je suis le owner, traité après

          const owner = mapOwnersFromMemberSide.get(String(c.ownerId));
          // Date par défaut (adhésion)
          const ts = m.updatedAt || m.createdAt || new Date(0);

          const memberId = userId;
          const threadId = `priv_${String(c._id)}_${memberId}`;

          return {
            id: threadId,
            type: "private",
            lastMessageAt: ts.toISOString(),
            unreadCount: 0,
            private: {
              owner: owner
                ? {
                    id: String(owner._id),
                    name: owner.fullName || "",
                    avatar: owner.avatarUrl || undefined,
                  }
                : undefined,
              member: {
                id: userId,
                name: "",
                avatar: undefined,
              },
              community: {
                name: c.name || "",
                logoUrl: c.logoUrl || undefined,
              },
            },
          };
        })
        .filter(Boolean);

      // B) PRIVÉS : je suis OWNER
      const ownedCommunities = await Community.find({
        ownerId: userId,
        deletedAt: null,
      })
        .select({ name: 1, logoUrl: 1 })
        .lean();

      const ownedCommunityIds = ownedCommunities.map((c) => String(c._id));

      const membersOfOwned = await CommunityMember.find({
        communityId: { $in: ownedCommunityIds },
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ communityId: 1, userId: 1, createdAt: 1, updatedAt: 1 })
        .lean();

      const memberUserIds = [
        ...new Set(membersOfOwned.map((m) => String(m.userId))),
      ];

      const memberUsers = await User.find({ _id: { $in: memberUserIds } })
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();

      const mapOwnedCommunities = new Map(
        ownedCommunities.map((c) => [String(c._id), c]),
      );
      const mapMemberUsers = new Map(
        memberUsers.map((u) => [String(u._id), u]),
      );

      const privateItemsAsOwner = membersOfOwned
        .map((m) => {
          const c = mapOwnedCommunities.get(String(m.communityId));
          if (!c) return null;

          const member = mapMemberUsers.get(String(m.userId));
          // Date par défaut
          const ts = m.updatedAt || m.createdAt || new Date(0);

          const memberId = String(m.userId);
          const threadId = `priv_${String(c._id)}_${memberId}`;

          return {
            id: threadId,
            type: "private",
            lastMessageAt: ts.toISOString(),
            unreadCount: 0,
            private: {
              owner: {
                id: userId,
                name: "",
                avatar: undefined,
              },
              member: member
                ? {
                    id: String(member._id),
                    name: member.fullName || "",
                    avatar: member.avatarUrl || undefined,
                  }
                : undefined,
              community: {
                name: c.name || "",
                logoUrl: c.logoUrl || undefined,
              },
            },
          };
        })
        .filter(Boolean);

      // C) GROUPES
      const ownedGroups = await CommunityGroup.find({
        owner: userId,
        deletedAt: null,
      })
        .select({ name: 1, coverUrl: 1, createdAt: 1 })
        .lean();

      const myGroupMemberships = await CommunityGroupMember.find({
        user: userId,
        leftAt: null,
      })
        .select({ group: 1, createdAt: 1, updatedAt: 1 })
        .lean();

      const groupIds = [
        ...new Set([
          ...ownedGroups.map((g) => String(g._id)),
          ...myGroupMemberships.map((m) => String(m.group)),
        ]),
      ];

      let groupItems = [];
      if (groupIds.length > 0) {
        const groups = await CommunityGroup.find({
          _id: { $in: groupIds },
          deletedAt: null,
        })
          .select({ name: 1, coverUrl: 1, createdAt: 1 })
          .lean();

        const mapGroups = new Map(groups.map((g) => [String(g._id), g]));
        const membershipMap = new Map(
          myGroupMemberships.map((m) => [String(m.group), m]),
        );

        groupItems = groupIds
          .map((gid) => {
            const g = mapGroups.get(gid);
            if (!g) return null;

            const membership = membershipMap.get(gid);
            // Date par défaut
            const ts =
              membership?.updatedAt ||
              membership?.createdAt ||
              g.createdAt ||
              new Date(0);

            return {
              id: gid,
              type: "group",
              lastMessageAt: ts.toISOString(),
              unreadCount: 0,
              group: {
                name: g.name || "Groupe",
                avatarUrl: g.coverUrl || null,
              },
            };
          })
          .filter(Boolean);
      }

      // 2️⃣ --- MERGE INITIAL ---
      let allItems = [
        ...privateItemsAsMember,
        ...privateItemsAsOwner,
        ...groupItems,
      ];

      // 3️⃣ --- CORRECTION DES DATES (La partie cruciale) ---
      // On va chercher dans la table des messages quelle est VRAIMENT la date du dernier message
      if (allItems.length > 0) {
        // On construit les clés (ex: "priv_xxx_yyy" ou "group_zzz")
        const threadKeys = allItems.map((it) =>
          it.type === "group" ? `group_${it.id}` : it.id,
        );

        // Aggregation MongoDB pour trouver le MAX(createdAt) par thread
        const lastMsgs = await CommunityDiscussionMessage.aggregate([
          { $match: { threadKey: { $in: threadKeys } } },
          { $sort: { createdAt: -1 } }, // Trie pour avoir le plus récent en premier
          {
            $group: {
              _id: "$threadKey",
              lastDate: { $first: "$createdAt" },
              lastBody: { $first: "$body" }, // On chope aussi le texte pour l'aperçu
            },
          },
        ]);

        // On transforme en Map pour accès rapide
        const mapLastInfo = new Map();
        lastMsgs.forEach((lm) => {
          mapLastInfo.set(lm._id, {
            date: lm.lastDate,
            body: lm.lastBody,
          });
        });

        // On met à jour nos items
        allItems = allItems.map((it) => {
          const tk = it.type === "group" ? `group_${it.id}` : it.id;
          const info = mapLastInfo.get(tk);

          if (info && info.date) {
            // ✅ On remplace la date "création" par la date du message !
            // (Seulement si le message est plus récent que la création, ce qui est logique)
            const msgDate = new Date(info.date).getTime();
            const currDate = new Date(it.lastMessageAt).getTime();

            if (msgDate > currDate) {
              it.lastMessageAt = info.date.toISOString();
            }
            // ✅ On ajoute l'aperçu du message
            it.lastMessagePreview = info.body || "Pièce jointe";
          }
          return it;
        });

        // 4️⃣ --- NOTIFICATIONS ---
        // (Reste inchangé)
        const notifs = await Notification.find({
          userId,
          seen: false,
          kind: "discussion_message",
          "payload.threadKey": { $in: threadKeys },
        })
          .select({ payload: 1 })
          .lean();

        const unreadByThreadKey = {};
        for (const n of notifs) {
          const tk = n.payload?.threadKey;
          if (!tk) continue;
          unreadByThreadKey[tk] = (unreadByThreadKey[tk] || 0) + 1;
        }

        allItems = allItems.map((it) => {
          const tk = it.type === "group" ? `group_${it.id}` : it.id;
          return {
            ...it,
            unreadCount: unreadByThreadKey[tk] || 0,
          };
        });
      }

      // 5️⃣ --- TRI FINAL ---
      // Maintenant que les dates sont corrigées, ce tri va placer le vrai dernier message en haut
      allItems.sort((a, b) => {
        const ta = new Date(a.lastMessageAt || 0).getTime();
        const tb = new Date(b.lastMessageAt || 0).getTime();
        return tb - ta;
      });

      // 6️⃣ --- PAGINATION ---
      const start = (page - 1) * limit;
      const end = start + limit;
      const paged = allItems.slice(start, end);

      return res.json({ ok: true, data: { items: paged } });
    } catch (e) {
      console.error(
        "[DISCUSSIONS] GET /threads ERROR:",
        e?.stack || e?.message || e,
      );
      return res.status(500).json({
        ok: false,
        error: "Impossible de charger les discussions.",
      });
    }
  });
};
