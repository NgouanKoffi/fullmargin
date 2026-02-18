const { Community } = require("./_shared");

module.exports = (router) => {
  /* GET /communaute/communities/by-slug/:slug */
  router.get("/by-slug/:slug", async (req, res) => {
    try {
      const slug = String(req.params.slug || "")
        .trim()
        .toLowerCase();
      const c = await Community.findOne({ slug, deletedAt: null }).lean();
      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });
      return res.json({ ok: true, data: { ...c, id: String(c._id) } });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });

  /* GET /communaute/communities/:id */
  router.get("/:id", async (req, res) => {
    try {
      const c = await Community.findOne({
        _id: req.params.id,
        deletedAt: null,
      }).lean();

      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

      const User = require("../../../models/user.model");
      const u = await User.findById(c.ownerId)
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();

      return res.json({
        ok: true,
        data: {
          id: String(c._id),
          name: c.name,
          slug: c.slug,
          ownerId: String(c.ownerId),
          owner: u
            ? {
                id: String(c.ownerId),
                fullName: u.fullName || "",
                avatarUrl: u.avatarUrl || "",
              }
            : { id: "", fullName: "", avatarUrl: "" },
          visibility: c.visibility,
          category: c.category,
          categoryOther: c.categoryOther || "",
          description: c.description,
          coverUrl: c.coverUrl || "",
          logoUrl: c.logoUrl || "",
          membersCount: Number(c.membersCount || 0),
          postsCount: Number(c.postsCount || 0),
          likesCount: Number(c.likesCount || 0),
          allowSubscribersPosts: Boolean(c.allowSubscribersPosts),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        },
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
