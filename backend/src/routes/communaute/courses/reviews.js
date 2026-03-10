const {
  mongoose,
  jsonBody,
  getAuth,
  isUserEnrolled,
  Course,
  CourseReview,
  User,
} = require("./_shared");

module.exports = (router) => {
  router.get("/:id/reviews", async (req, res) => {
    try {
      let courseObjectId;
      try {
        courseObjectId = new mongoose.Types.ObjectId(req.params.id);
      } catch {
        return res.json({ ok: true, data: [] });
      }

      const rows = await CourseReview.aggregate([
        { $match: { courseId: courseObjectId } },
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "u",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  displayName: 1,
                  fullName: 1,
                  email: 1,
                  avatar: 1,
                  avatarUrl: 1,
                  photo: 1,
                  picture: 1,
                  photoURL: 1,
                },
              },
            ],
          },
        },
        { $addFields: { user: { $first: "$u" } } },
        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            user: {
              _id: "$user._id",
              name: {
                $ifNull: [
                  "$user.displayName",
                  {
                    $ifNull: [
                      "$user.fullName",
                      {
                        $ifNull: [
                          "$user.name",
                          {
                            $cond: [
                              { $ifNull: ["$user.email", false] },
                              {
                                $arrayElemAt: [
                                  { $split: ["$user.email", "@"] },
                                  0,
                                ],
                              },
                              "Membre",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              avatar: {
                $ifNull: [
                  "$user.avatar",
                  {
                    $ifNull: [
                      "$user.avatarUrl",
                      {
                        $ifNull: [
                          "$user.photoURL",
                          {
                            $ifNull: [
                              "$user.photo",
                              { $ifNull: ["$user.picture", ""] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

      const data = rows.map((r) => ({
        id: String(r._id),
        rating: r.rating,
        comment: r.comment || "",
        createdAt: r.createdAt,
        user:
          r.user && r.user._id
            ? {
                id: String(r.user._id),
                name: r.user.name || "Membre",
                avatar: r.user.avatar || "",
              }
            : undefined,
      }));

      return res.json({ ok: true, data });
    } catch (e) {
      console.error("[COURSES] reviews list ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Lecture des avis impossible" });
    }
  });

  router.post("/:id/reviews", jsonBody, async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId)
        return res.status(401).json({ ok: false, error: "Non autorisé" });

      const { rating, comment } = req.body || {};
      const r = Number(rating);
      const text = String(comment || "").trim();

      if (!Number.isFinite(r) || r < 1 || r > 5)
        return res.status(400).json({ ok: false, error: "rating_invalid" });
      if (!text)
        return res.status(400).json({ ok: false, error: "comment_required" });

      const course = await Course.findOne({
        _id: req.params.id,
        deletedAt: null,
        isActive: true,
      }).lean();
      if (!course)
        return res.status(404).json({ ok: false, error: "Cours introuvable" });

      const enrolled = await isUserEnrolled(auth.userId, req.params.id);
      if (!enrolled) {
        return res.status(403).json({
          ok: false,
          error: "not_enrolled",
          message: "Inscription requise pour laisser un avis.",
        });
      }

      const now = new Date();
      const doc = await CourseReview.findOneAndUpdate(
        { userId: auth.userId, courseId: req.params.id },
        {
          $set: { rating: r, comment: text, updatedAt: now },
          $setOnInsert: {
            createdAt: now,
            userId: auth.userId,
            courseId: req.params.id,
          },
        },
        { upsert: true, new: true }
      ).lean();

      let courseObjectId;
      try {
        courseObjectId = new mongoose.Types.ObjectId(req.params.id);
      } catch {
        courseObjectId = null;
      }
      if (courseObjectId) {
        const agg = await CourseReview.aggregate([
          { $match: { courseId: courseObjectId } },
          {
            $group: {
              _id: "$courseId",
              count: { $sum: 1 },
              avg: { $avg: "$rating" },
            },
          },
        ]);
        await Course.updateOne(
          { _id: req.params.id },
          {
            $set: {
              reviewsCount: agg[0]?.count || 0,
              ratingAvg: agg[0]?.avg || null,
            },
          }
        );
      }

      const u = await User.findById(auth.userId)
        .select({
          name: 1,
          displayName: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          avatarUrl: 1,
          photoURL: 1,
        })
        .lean();

      const name =
        u?.displayName ||
        u?.fullName ||
        u?.name ||
        (u?.email ? String(u.email).split("@")[0] : "Membre");
      const avatar = u?.avatar || u?.avatarUrl || u?.photoURL || "";

      return res.status(201).json({
        ok: true,
        data: {
          ...doc,
          id: String(doc._id),
          user: u ? { id: String(u._id), name, avatar } : undefined,
        },
      });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ ok: false, error: "duplicate_review" });
      }
      console.error("[COURSES] review create ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Création d'avis impossible" });
    }
  });
};
