// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\courses\read.js
"use strict";

const {
  Course,
  User,
  Community,
  CommunityMember,
  getAuth,
  isUserEnrolled,
} = require("./_shared");

/**
 * Même logique d'accès que pour les PDF, avec en plus la visibilité :
 *
 * - si course.visibility = "private" :
 *      → owner communauté OU membre communauté OU admin
 *   ET
 *      → (owner du cours) OU admin OU inscrit OU cours gratuit
 *
 * - si course.visibility = "public" :
 *      → (owner du cours) OU admin OU inscrit OU cours gratuit (comme avant)
 */
async function canAccessCourse(auth, course) {
  if (!course) return false;

  const visibility = course.visibility === "private" ? "private" : "public";

  const userId = auth?.userId || null;

  // 🔐 Si cours privé → contrôle d'appartenance à la communauté
  if (visibility === "private") {
    if (!userId) return false;

    const [community, membership] = await Promise.all([
      Community.findOne({
        _id: course.communityId,
        deletedAt: null,
      })
        .select({ ownerId: 1 })
        .lean(),
      CommunityMember.findOne({
        communityId: course.communityId,
        userId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ _id: 1 })
        .lean(),
    ]);

    const isOwnerCommunity =
      community && String(community.ownerId) === String(userId);
    const isMember = !!membership;

    if (!isOwnerCommunity && !isMember) {
      return false;
    }
  }

  // 🔓 À partir d'ici, on applique l'ancienne règle d'accès au cours

  // cours gratuit → toujours OK (si le bloc au-dessus n'a pas rejeté pour private)
  if (course.priceType === "free") return true;

  if (!userId) return false;

  const isOwner = String(course.ownerId || "") === String(userId || "");

  let isAdmin = false;
  try {
    const me = await User.findById(userId).select({ roles: 1 }).lean();
    isAdmin = Array.isArray(me?.roles) && me.roles.includes("admin");
  } catch {
    /* ignore */
  }

  const enrolled = await isUserEnrolled(userId, course._id);

  return isOwner || isAdmin || enrolled;
}

module.exports = (router) => {
  /**
   * GET /api/communaute/courses/:id
   * → renvoie le cours complet pour le CoursePlayer
   */
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const course = await Course.findOne({
        _id: id,
        deletedAt: null,
      }).lean();

      if (!course) {
        return res.status(404).json({ ok: false, error: "Cours introuvable" });
      }

      const auth = getAuth(req);

      // contrôle d'accès
      const allowed = await canAccessCourse(auth, course);
      if (!allowed) {
        if (!auth || !auth.userId) {
          return res.status(401).json({ ok: false, error: "Non autorisé" });
        }
        return res
          .status(403)
          .json({ ok: false, error: "Inscription requise" });
      }

      // on renvoie le cours tel quel + id string
      return res.json({
        ok: true,
        data: { ...course, id: String(course._id) },
      });
    } catch (e) {
      console.error("[COURSES] read ERROR:", e?.stack || e);
      return res.status(500).json({ ok: false, error: "Lecture impossible" });
    }
  });
};
