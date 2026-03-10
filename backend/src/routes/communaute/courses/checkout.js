// backend/src/routes/communaute/courses/checkout.js
const { doFetch, getAuth, Course } = require("./_shared");
const CommunityMember = require("../../../models/communityMember.model");

module.exports = (router) => {
  router.post("/:id/checkout", async (req, res) => {
    try {
      const courseId = String(req.params.id);

      // 🔐 Vérifier l'auth
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      // 🔴 Vérifier le cours + la communauté liée
      const course = await Course.findOne({
        _id: courseId,
        deletedAt: null,
        isActive: true,
      }).lean();

      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      // 🔴 Vérifier que l'utilisateur est bien membre actif de la communauté
      if (course.communityId) {
        const membership = await CommunityMember.findOne({
          communityId: course.communityId,
          userId: auth.userId,
          $or: [{ status: "active" }, { status: { $exists: false } }],
        }).lean();

        if (!membership) {
          return res.status(403).json({
            ok: false,
            error: "NOT_COMMUNITY_MEMBER",
            message:
              "Tu dois d’abord être abonné à la communauté pour payer cette formation.",
          });
        }
      }

      // 🔗 Base de l'API publique (prod : https://api.fullmargin.net)
      const base =
        process.env.PUBLIC_API_BASE_URL || // ex: https://api.fullmargin.net
        process.env.API_BASE_URL || // ancien nom éventuel
        process.env.API_PUBLIC_BASE || // ta variable actuelle en prod
        process.env.APP_URL || // fallback éventuel
        "http://localhost:3000"; // dernier recours (dev)

      const url = `${String(base).replace(
        /\/$/,
        ""
      )}/api/courses/payments/${encodeURIComponent(courseId)}/checkout`;

      // On forward le token tel quel vers l'API publique
      const authHeader =
        req.headers.authorization ||
        (req.query?.token ? `Bearer ${req.query.token}` : "");

      const r = await doFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({}),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(r.status).json(j);

      res.set("Cache-Control", "no-store");
      return res.json(j);
    } catch (e) {
      console.error(
        "[COMMUNAUTÉ COURSES] proxy checkout error:",
        e?.stack || e
      );
      return res.status(500).json({ ok: false, error: "Checkout proxy error" });
    }
  });
};
