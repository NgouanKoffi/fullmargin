const { Community } = require("./_shared");
const CommunityReview = require("../../../models/communityReview.model");
const mongoose = require("mongoose");

module.exports = (router) => {
  router.get("/ratings/avg", async (req, res) => {
    try {
      let ids = [];

      const idsParam = String(req.query.ids || "").trim();
      const slugsParam = String(req.query.slugs || "").trim();

      if (idsParam) {
        ids = idsParam.split(",").map((x) => x.trim());
      } else if (slugsParam) {
        const slugs = slugsParam.split(",").map((x) => x.trim().toLowerCase());

        const rows = await Community.find({
          slug: { $in: slugs },
          deletedAt: null,
        })
          .select({ _id: 1 })
          .lean();

        ids = rows.map((r) => String(r._id));
      }

      if (!ids.length) return res.json({ ok: true, data: { items: [] } });

      const agg = await CommunityReview.aggregate([
        {
          $match: {
            communityId: {
              $in: ids.map((x) =>
                mongoose.Types.ObjectId.createFromHexString(x)
              ),
            },
            hidden: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$communityId",
            count: { $sum: 1 },
            avg: { $avg: "$rating" },
          },
        },
      ]);

      const byId = new Map(
        agg.map((r) => [
          String(r._id),
          {
            communityId: String(r._id),
            count: r.count,
            avg: Number((r.avg || 0).toFixed(1)),
          },
        ])
      );

      const items = ids.map(
        (id) => byId.get(id) || { communityId: id, count: 0, avg: null }
      );

      return res.json({ ok: true, data: { items } });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
