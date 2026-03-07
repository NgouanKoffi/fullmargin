// backend/src/routes/communaute/courses/admin-enroll.js
const {
  getAuth,
  Course,
  CourseEnrollment,
  User,
  assertCommunityOwner,
  Community, // ✅ Ajouté pour récupérer le nom de la communauté
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

module.exports = (router) => {
  /**
   * POST /communaute/courses/:id/admin-enroll
   * body: { userId }
   *
   * ➜ Le propriétaire de la communauté peut inscrire n’importe quel user
   * à ce cours, PAYANT ou GRATUIT, sans passer par Stripe ni par les
   * contraintes d’abonnement.
   */
  router.post("/:id/admin-enroll", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const courseId = String(req.params.id || "");
      const { userId } = req.body || {};

      if (!userId) {
        return res
          .status(400)
          .json({ ok: false, error: "userId requis pour l’inscription" });
      }

      const course = await Course.findOne({
        _id: courseId,
        deletedAt: null,
        isActive: true,
      })
        .select({
          _id: 1,
          communityId: 1,
          title: 1,
        })
        .lean();

      if (!course) {
        return res
          .status(404)
          .json({ ok: false, error: "Cours introuvable ou inactif" });
      }

      // 🔐 Vérifier que l'appelant est bien propriétaire de la communauté
      let communityName = "";
      if (course.communityId) {
        const checkOwner = await assertCommunityOwner(
          course.communityId,
          auth.userId,
        );
        if (!checkOwner.ok) {
          return res.status(403).json({ ok: false, error: "Interdit" });
        }

        // Récupérer le nom de la communauté pour la notif
        const comm = await Community.findById(course.communityId)
          .select("name")
          .lean();
        if (comm) communityName = comm.name;
      }

      // Vérifier que la cible existe
      const targetUser = await User.findOne({ _id: userId })
        .select({ fullName: 1 })
        .lean();
      if (!targetUser) {
        return res
          .status(404)
          .json({ ok: false, error: "Utilisateur cible introuvable" });
      }

      // 🔵 Upsert de l'inscription (on ne s’occupe PAS du prix ici)
      const payload = { userId, courseId: course._id };
      await CourseEnrollment.updateOne(
        payload,
        { $setOnInsert: payload },
        { upsert: true },
      );

      const enrolled = await CourseEnrollment.findOne(payload).lean();

      // 🔔 Notifications :
      //   1) UNIQUEMENT à l’utilisateur : "on t’a inscrit à un cours"
      try {
        await createNotif({
          userId,
          kind: "course_manual_enrollment",
          communityId: course.communityId ? String(course.communityId) : null,
          courseId: course._id,
          payload: {
            courseId: String(course._id),
            courseTitle: course.title || "Formation",
            communityName, // ✅ Ajouté ici
            byUserId: String(auth.userId),
          },
        });
      } catch (e) {
        // ne pas casser si la notif plante
        console.error("[ADMIN ENROLL] notif failed:", e?.message || e);
      }

      return res.json({
        ok: true,
        data: {
          id: String(enrolled._id),
          userId: String(userId),
          courseId: String(course._id),
        },
      });
    } catch (e) {
      console.error("[ADMIN ENROLL] enroll ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Inscription manuelle impossible" });
    }
  });

  /**
   * POST /communaute/courses/:id/admin-unenroll
   * body: { userId }
   *
   * ➜ Le propriétaire peut retirer l’accès au cours pour un user.
   */
  router.post("/:id/admin-unenroll", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const courseId = String(req.params.id || "");
      const { userId } = req.body || {};

      if (!userId) {
        return res
          .status(400)
          .json({ ok: false, error: "userId requis pour la désinscription" });
      }

      const course = await Course.findOne({
        _id: courseId,
        deletedAt: null,
        isActive: true,
      })
        .select({
          _id: 1,
          communityId: 1,
          title: 1,
        })
        .lean();

      if (!course) {
        return res
          .status(404)
          .json({ ok: false, error: "Cours introuvable ou inactif" });
      }

      // 🔐 Vérifier owner
      let communityName = "";
      if (course.communityId) {
        const checkOwner = await assertCommunityOwner(
          course.communityId,
          auth.userId,
        );
        if (!checkOwner.ok) {
          return res.status(403).json({ ok: false, error: "Interdit" });
        }

        // Récupérer le nom de la communauté pour la notif
        const comm = await Community.findById(course.communityId)
          .select("name")
          .lean();
        if (comm) communityName = comm.name;
      }

      // On supprime l’inscription si elle existe
      await CourseEnrollment.deleteOne({
        userId,
        courseId: course._id,
      });

      // 🔔 Notifications :
      //   1) UNIQUEMENT au user : "on t’a retiré de la formation"
      try {
        await createNotif({
          userId,
          kind: "course_manual_unenrollment",
          communityId: course.communityId ? String(course.communityId) : null,
          courseId: course._id,
          payload: {
            courseId: String(course._id),
            courseTitle: course.title || "Formation",
            communityName, // ✅ Ajouté ici
            byUserId: String(auth.userId),
          },
        });
      } catch (e) {
        console.error("[ADMIN UNENROLL] notif failed:", e?.message || e);
      }

      return res.json({
        ok: true,
        data: {
          userId: String(userId),
          courseId: String(course._id),
          removed: true,
        },
      });
    } catch (e) {
      console.error("[ADMIN UNENROLL] ERROR:", e?.stack || e);
      return res.status(500).json({
        ok: false,
        error: "Désinscription manuelle impossible",
      });
    }
  });

  /**
   * GET /communaute/courses/:id/admin-enrollment?userId=xxx
   *
   * ➜ Permet à l’admin de savoir si un user a déjà accès à ce cours.
   * Utilisé par le front pour afficher soit "Inscrire" soit "Retirer l’accès".
   */
  router.get("/:id/admin-enrollment", async (req, res) => {
    try {
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      const courseId = String(req.params.id || "");
      const userId = String(req.query.userId || "");

      if (!userId) {
        return res.status(400).json({ ok: false, error: "userId requis" });
      }

      const course = await Course.findOne({
        _id: courseId,
        deletedAt: null,
        isActive: true,
      })
        .select({ _id: 1, communityId: 1 })
        .lean();

      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      // 🔐 Vérifier que l’appelant est bien owner de la communauté
      if (course.communityId) {
        const checkOwner = await assertCommunityOwner(
          course.communityId,
          auth.userId,
        );
        if (!checkOwner.ok) {
          return res.status(403).json({ ok: false, error: "Interdit" });
        }
      }

      const found = await CourseEnrollment.findOne({
        userId,
        courseId: course._id,
      })
        .select({ _id: 1 })
        .lean();

      const enrolled = !!found;

      return res.json({ ok: true, data: { enrolled } });
    } catch (e) {
      console.error("[ADMIN ENROLL] admin-enrollment ERROR:", e?.stack || e);
      return res.status(500).json({
        ok: false,
        error: "Lecture de l’inscription impossible",
      });
    }
  });
};
