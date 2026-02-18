// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\communauties\mine.js
const { requireAuth, Community } = require("./_shared");
const CommunityPost = require("../../../models/communityPost.model");

module.exports = (router) => {
  router.get("/mine", requireAuth, async (req, res) => {
    try {
      const communityId = String(req.query.communityId || "").trim();
      if (!communityId)
        return res.status(400).json({ ok: false, error: "communityId requis" });

      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.min(
        50,
        Math.max(1, parseInt(String(req.query.limit || "20"), 10))
      );
      const skip = (page - 1) * limit;

      const q = {
        communityId,
        authorId: req.auth.userId,
        deletedAt: null,
      };

      const [items, total] = await Promise.all([
        CommunityPost.find(q)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CommunityPost.countDocuments(q),
      ]);

      const mapped = items.map((p) => ({
        id: String(p._id),
        communityId: String(p.communityId),
        authorId: String(p.authorId),
        content: p.content || "",
        media: (Array.isArray(p.media) ? p.media : []).map((m) => ({
          kind: m.kind || m.type || "image",
          url: m.url || "",
          thumbnail: m.thumbnail || "",
          publicId: m.publicId || "",
          width: Number(m.width || 0),
          height: Number(m.height || 0),
        })),
        likesCount: Number(p.likesCount || 0),
        commentsCount: Number(p.commentsCount || 0),
        isEdited: !!p.isEdited,
        editedAt: p.editedAt || null,
        createdAt: p.createdAt,
      }));

      return res.json({
        ok: true,
        data: {
          items: mapped,
          page,
          limit,
          total,
          hasMore: skip + items.length < total,
        },
      });
    } catch (e) {
      console.error("[POSTS] mine ERROR:", e);
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
