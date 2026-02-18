// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\courses\delete.js
const { getAuth, assertCommunityOwner, Course } = require("./_shared");

module.exports = (router) => {
  router.delete("/:id", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId)
        return res.status(401).json({ ok: false, error: "Non autorisé" });

      const course = await Course.findOne({
        _id: req.params.id,
        deletedAt: null,
      }).lean();
      if (!course)
        return res.status(404).json({ ok: false, error: "Introuvable" });

      const check = await assertCommunityOwner(course.communityId, auth.userId);
      if (!check.ok)
        return res.status(403).json({ ok: false, error: check.error });

      const now = new Date();
      await Course.updateOne(
        { _id: req.params.id },
        { $set: { deletedAt: now, isActive: false } }
      );

      return res.json({
        ok: true,
        data: { id: String(req.params.id), deletedAt: now },
      });
    } catch (e) {
      console.error("[COURSES] delete ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Suppression impossible" });
    }
  });
};
