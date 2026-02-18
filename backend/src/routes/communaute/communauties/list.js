// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\communauties\list.js
const { requireAuth, Community, uploadImageBuffer } = require("./_shared");

module.exports = (router) => {
  /* GET /communaute/communities/my */
  router.get("/my", requireAuth, async (req, res) => {
    try {
      const rows = await Community.find({
        ownerId: req.auth.userId,
        deletedAt: null,
      })
        .sort({ createdAt: -1 })
        .lean();

      const items = rows.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        visibility: c.visibility,
        category: c.category,
        categoryOther: c.categoryOther || "",
        description: c.description || "",
        coverUrl: c.coverUrl || "",
        logoUrl: c.logoUrl || "",
        membersCount: Number(c.membersCount || 0),
        postsCount: Number(c.postsCount || 0),
        likesCount: Number(c.likesCount || 0),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      res.set("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[COMMUNITIES] my list ERROR:", e);
      return res
        .status(500)
        .json({ ok: false, error: "Chargement impossible" });
    }
  });

  /* GET /communaute/communities/public */
  router.get("/public", async (req, res) => {
    try {
      const cat = String(req.query.category || "")
        .trim()
        .toLowerCase();
      const findQuery = { deletedAt: null };
      if (cat) findQuery.category = cat;

      const rows = await Community.find(findQuery)
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

      const ownerIds = [
        ...new Set(rows.map((c) => String(c.ownerId)).filter(Boolean)),
      ];
      const User = require("../../../models/user.model");

      let ownersById = new Map();
      if (ownerIds.length) {
        const owners = await User.find({ _id: { $in: ownerIds } })
          .select({ _id: 1, fullName: 1, avatarUrl: 1 })
          .lean();

        ownersById = new Map(
          owners.map((u) => [
            String(u._id),
            {
              id: String(u._id),
              fullName: u.fullName,
              avatarUrl: u.avatarUrl,
            },
          ])
        );
      }

      const items = rows.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        category: c.category || "",
        visibility: c.visibility || "public",
        coverUrl: c.coverUrl || "",
        logoUrl: c.logoUrl || "",
        membersCount: Number(c.membersCount || 0),
        postsCount: Number(c.postsCount || 0),
        likesCount: Number(c.likesCount || 0),
        owner: ownersById.get(String(c.ownerId)) || {
          id: String(c.ownerId || ""),
          fullName: "",
          avatarUrl: "",
        },
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      res.set("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[COMMUNITIES] public list ERROR:", e);
      return res
        .status(500)
        .json({ ok: false, error: "Chargement impossible" });
    }
  });

  /* GET /communaute/communities/batch?ids=1,2,3 */
  router.get("/batch", async (req, res) => {
    try {
      const ids = String(req.query.ids || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      if (!ids.length) return res.json({ ok: true, data: { items: [] } });

      const rows = await Community.find({
        _id: { $in: ids },
        deletedAt: null,
      })
        .select("_id name slug logoUrl coverUrl ownerId likesCount postsCount")
        .lean();

      const items = rows.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        logoUrl: c.logoUrl || "",
        coverUrl: c.coverUrl || "",
        ownerId: String(c.ownerId),
        postsCount: Number(c.postsCount || 0),
        likesCount: Number(c.likesCount || 0),
      }));

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[COMMUNITIES] batch ERROR:", e);
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
