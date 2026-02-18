// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\courses\me-enrollments.js
const { mongoose, getAuth, CourseEnrollment } = require("./_shared");

module.exports = (router) => {
  router.get("/me/enrollments", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId)
        return res.status(401).json({ ok: false, error: "Non autorisé" });

      const userObjectId = new mongoose.Types.ObjectId(auth.userId);

      const rows = await CourseEnrollment.aggregate([
        { $match: { userId: userObjectId } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  communityId: 1,
                  title: 1,
                  coverUrl: 1,
                  priceType: 1,
                  currency: 1,
                  price: 1,
                  deletedAt: 1,
                  isActive: 1,
                },
              },
            ],
          },
        },
        { $addFields: { course: { $first: "$course" } } },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            course: {
              _id: 1,
              communityId: 1,
              title: 1,
              coverUrl: 1,
              priceType: 1,
              currency: 1,
              price: 1,
              deletedAt: 1,
              isActive: 1,
            },
          },
        },
      ]);

      const items = rows
        .filter((r) => r.course && !r.course.deletedAt)
        .map((r) => ({
          id: String(r._id),
          enrolledAt: r.createdAt || null,
          course: {
            id: String(r.course._id),
            title: r.course.title || "Cours",
            coverUrl: r.course.coverUrl || "",
            communityId: r.course.communityId
              ? String(r.course.communityId)
              : null,
            priceType: r.course.priceType || "free",
            currency: r.course.currency || "USD",
            price:
              r.course.priceType === "paid" &&
              typeof r.course.price === "number"
                ? r.course.price
                : null,
            isActive: !!r.course.isActive,
          },
        }));

      res.set("Cache-Control", "no-store");
      return res.json({ ok: true, data: { items } });
    } catch (e) {
      console.error("[COURSES] my enrollments error:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Lecture des inscriptions impossible" });
    }
  });
};
