// backend/src/routes/communaute/posts/listPosts.js
const {
  Community,
  CommunityPost,
  CommunityPostLike,
  CommunityComment,
  User,
  CommunityMember,
} = require("./_shared");

module.exports = async function listPosts(req, res) {
  try {
    const rawId = String(req.query.communityId || "").trim();
    const hasId = /^[a-f0-9]{24}$/i.test(rawId);

    const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "10"), 10) || 10, 1),
      30
    );

    const userId = req.auth?.userId ? String(req.auth.userId) : null;

    // scope : "my-communities" / "public-others"
    const rawScope = String(req.query.scope || "").trim();
    const scope =
      rawScope === "my-communities"
        ? "my-communities"
        : rawScope === "public-others"
        ? "public-others"
        : null;

    // ─── Pré-charger les communautés de l'utilisateur si scope actif ───
    let myCommunityIds = new Set(); // IDs (strings) des communautés dont je suis membre ou owner

    if (userId && scope) {
      const [members, owned] = await Promise.all([
        CommunityMember.find({
          userId,
          $or: [{ status: "active" }, { status: { $exists: false } }],
        })
          .select({ communityId: 1 })
          .lean(),
        Community.find({
          ownerId: userId,
          deletedAt: null,
        })
          .select({ _id: 1 })
          .lean(),
      ]);

      for (const m of members) myCommunityIds.add(String(m.communityId));
      for (const c of owned) myCommunityIds.add(String(c._id));
    }

    // ─── Construction de la requête principale ───
    const q = {
      deletedAt: null,
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
    };

    // 🔑 Quand un scope est fourni, il prime sur le communityId individuel.
    //    Le communityId seul sert pour la vue d'une communauté précise (pas de scope).
    if (userId && scope === "my-communities") {
      // "Ma communauté" → posts des communautés où je suis membre/owner
      if (myCommunityIds.size === 0) {
        // pas d'abonnements → retourner vide directement
        return res.json({
          ok: true,
          data: { items: [], page, limit, hasMore: false, total: 0 },
        });
      }
      q.communityId = { $in: Array.from(myCommunityIds) };
    } else if (userId && scope === "public-others") {
      // "Autres communautés" → posts publics des communautés où je ne suis PAS membre
      q.visibility = "public";
      if (myCommunityIds.size > 0) {
        q.communityId = { $nin: Array.from(myCommunityIds) };
      }
    } else if (hasId) {
      // vue d'une communauté précise (pas de scope)
      q.communityId = rawId;
    } else if (!userId) {
      // non connecté → uniquement posts publics
      q.visibility = "public";
    }

    // ─── Requête paginée ───
    const [rows, totalCount] = await Promise.all([
      CommunityPost.find(q)
        .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments(q),
    ]);

    // ─── Filtre de visibilité (posts privés) pour les utilisateurs connectés ───
    let visibleRows = rows;

    if (userId && !scope) {
      // Pas de scope spécifique → on applique le filtre de visibilité classique
      const communityIds = [
        ...new Set(rows.map((r) => String(r.communityId || ""))),
      ].filter(Boolean);

      let memberSet = new Set();
      let ownerSet = new Set();

      if (communityIds.length) {
        const [members, owned] = await Promise.all([
          CommunityMember.find({
            communityId: { $in: communityIds },
            userId,
            $or: [{ status: "active" }, { status: { $exists: false } }],
          })
            .select({ communityId: 1 })
            .lean(),
          Community.find({
            _id: { $in: communityIds },
            ownerId: userId,
            deletedAt: null,
          })
            .select({ _id: 1 })
            .lean(),
        ]);

        memberSet = new Set(members.map((m) => String(m.communityId)));
        ownerSet = new Set(owned.map((c) => String(c._id)));
      }

      visibleRows = rows.filter((r) => {
        const v = r.visibility || "public";
        const cid = String(r.communityId);
        const isMember = memberSet.has(cid);
        const isOwner = ownerSet.has(cid);
        const isAuthor = String(r.authorId) === userId;

        if (v === "public") return true;
        return isMember || isAuthor || isOwner;
      });
    } else if (userId && scope === "my-communities") {
      // Pour "ma communauté" : on peut voir les posts privés si on est membre/owner
      // (déjà filtré par communityId dans la requête, donc on laisse passer tout)
      // Mais on filtre quand même les posts privés si on n'est pas membre
      visibleRows = rows.filter((r) => {
        const v = r.visibility || "public";
        const cid = String(r.communityId);
        const inMy = myCommunityIds.has(cid);
        const isAuthor = String(r.authorId) === userId;
        if (v === "public") return true;
        return inMy || isAuthor;
      });
    }
    // Pour "public-others" : la requête DB filtre déjà sur visibility=public → pas besoin de re-filtrer

    const postIds = visibleRows.map((r) => r._id);

    const likesAgg = await CommunityPostLike.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const likesByPostId = new Map(
      likesAgg.map((x) => [String(x._id), x.count || 0])
    );

    const commentsAgg = await CommunityComment.aggregate([
      { $match: { postId: { $in: postIds }, deletedAt: null } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const commentsByPostId = new Map(
      commentsAgg.map((x) => [String(x._id), x.count || 0])
    );

    let likedSet = new Set();
    if (userId) {
      const mine = await CommunityPostLike.find({
        postId: { $in: postIds },
        userId,
      })
        .select({ postId: 1 })
        .lean();
      likedSet = new Set(mine.map((m) => String(m.postId)));
    }

    const authorIds = [...new Set(visibleRows.map((r) => String(r.authorId)))];
    const authors = await User.find({ _id: { $in: authorIds } })
      .select({ _id: 1, fullName: 1, avatarUrl: 1 })
      .lean();
    const byId = new Map(authors.map((u) => [String(u._id), u]));

    const items = visibleRows.map((r) => {
      const liveLikes = likesByPostId.get(String(r._id)) ?? 0;
      const liveComments = commentsByPostId.get(String(r._id)) ?? 0;
      const a = byId.get(String(r.authorId));

      const authorPayload = {
        id: String(r.authorId),
        name: a?.fullName || "",
        fullName: a?.fullName || "",
        avatarUrl: a?.avatarUrl || "",
      };

      return {
        id: String(r._id),
        communityId: String(r.communityId),
        author: authorPayload,
        authorName: authorPayload.fullName,
        authorFullName: authorPayload.fullName,
        authorAvatarUrl: authorPayload.avatarUrl,
        content: r.content || "",
        media: (r.media || []).map((m) => ({
          kind: m.kind === "video" ? "video" : "image",
          type: m.kind === "video" ? "video" : "image",
          url: m.url,
          thumbnail: m.thumbnail || "",
          publicId: m.publicId || "",
          width: m.width,
          height: m.height,
          duration: m.duration,
        })),
        likes: liveLikes,
        likedByMe: likedSet.has(String(r._id)),
        comments: liveComments,
        createdAt: r.createdAt,
        isPublished: typeof r.isPublished === "boolean" ? r.isPublished : true,
        publishedAt: r.publishedAt || null,
        deletedAt: r.deletedAt
          ? r.deletedAt.toISOString?.() || r.deletedAt
          : undefined,
        visibility: r.visibility || "public",
      };
    });

    // hasMore basé sur le total réel
    const hasMore = page * limit < totalCount;

    return res.json({
      ok: true,
      data: { items, page, limit, hasMore, total: totalCount },
    });
  } catch (e) {
    console.error("[POSTS] list ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
};
