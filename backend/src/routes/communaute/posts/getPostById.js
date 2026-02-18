// backend/src/routes/communaute/posts/getPostById.js
const {
  Community,
  CommunityPost,
  CommunityMember,
  User,
} = require("./_shared");

module.exports = async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findOne({ _id: id }).lean();
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post introuvable" });
    }

    // 👉 si visibility est undefined ou "public" → considéré comme public
    const visibility = post.visibility === "private" ? "private" : "public";

    // 🔐 si c'est privé, on vérifie les droits d'accès
    if (visibility === "private") {
      const authUserId = req.auth?.userId ? String(req.auth.userId) : null;

      if (!authUserId) {
        return res.status(403).json({
          ok: false,
          error: "Ce post est privé.",
        });
      }

      const [community, membership] = await Promise.all([
        Community.findOne({
          _id: post.communityId,
          deletedAt: null,
        })
          .select({ _id: 1, ownerId: 1 })
          .lean(),
        CommunityMember.findOne({
          communityId: post.communityId,
          userId: authUserId,
          $or: [{ status: "active" }, { status: { $exists: false } }],
        })
          .select({ _id: 1 })
          .lean(),
      ]);

      const isAuthor = String(post.authorId) === authUserId;
      const isOwner = community && String(community.ownerId) === authUserId;
      const isMember = !!membership;

      if (!isAuthor && !isOwner && !isMember) {
        return res.status(403).json({
          ok: false,
          error: "Ce post est privé.",
        });
      }
    }

    let author = null;
    if (post.authorId) {
      author = await User.findOne({ _id: post.authorId })
        .select({ _id: 1, fullName: 1, avatarUrl: 1 })
        .lean();
    }

    return res.json({
      ok: true,
      data: {
        id: String(post._id),
        communityId: String(post.communityId),
        author: author
          ? {
              id: String(author._id),
              name: author.fullName || "",
              avatarUrl: author.avatarUrl || "",
            }
          : {
              id: String(post.authorId || ""),
              name: "",
              avatarUrl: "",
            },
        content: post.content || "",
        media: post.media || [],
        visibility, // renvoyée au front
        createdAt: post.createdAt,
        deletedAt: post.deletedAt
          ? post.deletedAt.toISOString?.() || post.deletedAt
          : null,
      },
    });
  } catch (e) {
    console.error("[POSTS] get by id ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
};
