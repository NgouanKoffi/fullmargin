// backend/src/routes/admin/moderation.js
const express = require("express");
const { verifyAuthHeader } = require("../auth/_helpers");
const Community = require("../../models/community.model");
const CommunityPost = require("../../models/communityPost.model");
const Course = require("../../models/course.model");
const User = require("../../models/user.model");
const { createNotif } = require("../../utils/notifications");
const { sendCommunityPostDeletedEmail, sendCommunityDeletedByAdminEmail } = require("../../utils/mailer");

// Middleware Admin stricte
function requireAdmin(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });

    // Vérification du rôle admin (selon la structure de ton token)
    if (a.role !== "admin" && !(a.roles && a.roles.includes("admin"))) {
      return res
        .status(403)
        .json({ ok: false, error: "Accès administrateur requis." });
    }

    req.auth = { userId: a.userId, role: "admin" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

module.exports = (router) => {
  const jsonParser = express.json();

  // 0️⃣ LISTER TOUS LES POSTS
  router.get("/moderate/posts", requireAdmin, async (req, res) => {
    try {
      const { communityId, page = 1, limit = 50 } = req.query;
      const query = { deletedAt: null };
      if (communityId) query.communityId = communityId;

      const posts = await CommunityPost.find(query)
        .populate("authorId", "fullName email avatarUrl")
        .populate("communityId", "name slug logoUrl")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await CommunityPost.countDocuments(query);

      return res.json({ ok: true, posts, total });
    } catch (e) {
      console.error("[ADMIN MODERATION] List Posts Error:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });

  // 1️⃣ SUSPENDRE / SUPPRIMER UN POST
  router.post("/moderate/post", requireAdmin, jsonParser, async (req, res) => {
    try {
      const { id, reason } = req.body;
      if (!id || !reason)
        return res.status(400).json({ ok: false, error: "ID et motif requis" });

      const post = await CommunityPost.findById(id);
      if (!post || post.deletedAt)
        return res.status(404).json({ ok: false, error: "Post introuvable" });

      // Soft delete
      post.deletedAt = new Date();
      await post.save();

      // Mettre à jour le compteur de la communauté
      await Community.updateOne(
        { _id: post.communityId },
        { $inc: { postsCount: -1 } },
      );

      // 🔔 Notifier l'auteur du post
      await createNotif({
        userId: String(post.authorId),
        kind: "community_post_deleted_by_admin",
        communityId: String(post.communityId),
        payload: {
          postId: String(post._id),
          reason: reason, // On transmet le motif !
        },
      });

      // 📧 Envoyer un email à l'auteur
      try {
        const author = await User.findById(post.authorId).lean();
        const community = await Community.findById(post.communityId).lean();
        if (author && author.email) {
          await sendCommunityPostDeletedEmail({
            to: author.email,
            fullName: author.fullName,
            communityName: community ? community.name : "une communauté",
            reason: reason,
          });
        }
      } catch (err) {
        console.error("[ADMIN MODERATION] Email Error:", err);
      }

      return res.json({ ok: true, message: "Post suspendu avec succès" });
    } catch (e) {
      console.error("[ADMIN MODERATION] Post Error:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });

  // 2️⃣ SUSPENDRE / SUPPRIMER UNE FORMATION
  router.post(
    "/moderate/course",
    requireAdmin,
    jsonParser,
    async (req, res) => {
      try {
        const { id, reason } = req.body;
        if (!id || !reason)
          return res
            .status(400)
            .json({ ok: false, error: "ID et motif requis" });

        const course = await Course.findById(id);
        if (!course || course.deletedAt)
          return res
            .status(404)
            .json({ ok: false, error: "Formation introuvable" });

        course.deletedAt = new Date();
        course.isActive = false;
        await course.save();

        // 🔔 Notifier le créateur de la formation
        await createNotif({
          userId: String(course.ownerId),
          kind: "community_course_deleted_by_admin",
          communityId: String(course.communityId),
          payload: {
            courseId: String(course._id),
            courseTitle: course.title,
            reason: reason,
          },
        });

        return res.json({
          ok: true,
          message: "Formation suspendue avec succès",
        });
      } catch (e) {
        console.error("[ADMIN MODERATION] Course Error:", e);
        return res.status(500).json({ ok: false, error: "Erreur serveur" });
      }
    },
  );

  // 3️⃣ SUSPENDRE / SUPPRIMER UNE COMMUNAUTÉ
  router.post(
    "/moderate/community",
    requireAdmin,
    jsonParser,
    async (req, res) => {
      try {
        const { id, reason } = req.body;
        if (!id || !reason)
          return res
            .status(400)
            .json({ ok: false, error: "ID et motif requis" });

        const community = await Community.findById(id);
        if (!community || community.deletedAt)
          return res
            .status(404)
            .json({ ok: false, error: "Communauté introuvable" });

        community.deletedAt = new Date();
        community.isActive = false;
        await community.save();

        // 🔔 Notifier le propriétaire de la communauté
        await createNotif({
          userId: String(community.ownerId),
          kind: "community_deleted_by_admin",
          payload: {
            communityId: String(community._id),
            communityName: community.name,
            reason: reason,
          },
        });

        // 📧 Envoyer un email au propriétaire
        try {
          const owner = await User.findById(community.ownerId).lean();
          if (owner?.email) {
            await sendCommunityDeletedByAdminEmail({
              to: owner.email,
              fullName: owner.fullName,
              communityName: community.name,
              reason,
            });
          }
        } catch (err) {
          console.error("[ADMIN MODERATION] Community email error:", err);
        }

        return res.json({
          ok: true,
          message: "Communauté suspendue avec succès",
        });
      } catch (e) {
        console.error("[ADMIN MODERATION] Community Error:", e);
        return res.status(500).json({ ok: false, error: "Erreur serveur" });
      }
    },
  );
};
