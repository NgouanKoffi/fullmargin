// backend/src/routes/communaute/posts/listMyPosts.js
const { CommunityPost } = require("./_shared");

module.exports = async function listMyPosts(req, res) {
  try {
    const rawId = String(req.query.communityId || "").trim();
    const hasId = /^[a-f0-9]{24}$/i.test(rawId);
    const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1),
      100
    );

    const q = { deletedAt: null, authorId: req.auth.userId };
    if (hasId) q.communityId = rawId;

    const rows = await CommunityPost.find(q).lean();

    const byScore = (r) => {
      const a =
        (r.publishedAt && Date.parse(r.publishedAt)) ||
        (r.scheduledAt && Date.parse(r.scheduledAt)) ||
        Date.parse(r.createdAt);
      return isNaN(a) ? 0 : a;
    };
    rows.sort((a, b) => byScore(b) - byScore(a));

    const start = (page - 1) * limit;
    const paged = rows.slice(start, start + limit);
    const total = rows.length;
    const hasMore = start + paged.length < total;

    const items = paged.map((r) => ({
      id: String(r._id),
      communityId: String(r.communityId),
      authorId: String(r.authorId),
      content: r.content || "",
      media: (r.media || []).map((m) => {
        const t = m.kind === "video" ? "video" : "image";
        return {
          kind: t,
          type: t,
          url: m.url,
          thumbnail: m.thumbnail || "",
          publicId: m.publicId || "",
          width: m.width,
          height: m.height,
          duration: m.duration,
        };
      }),
      // 👉 undefined => "public"
      visibility: r.visibility === "private" ? "private" : "public",
      likesCount: Number(r.likesCount || 0),
      commentsCount: Number(r.commentsCount || 0),
      isPublished: typeof r.isPublished === "boolean" ? r.isPublished : true,
      publishedAt: r.publishedAt || null,
      scheduledAt: r.scheduledAt || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ ok: true, data: { items, page, limit, hasMore, total } });
  } catch (e) {
    console.error("[POSTS] mine ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
};
