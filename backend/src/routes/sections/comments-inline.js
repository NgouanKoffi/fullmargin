// backend/src/routes/sections/comments-inline.js
module.exports = function commentsInlineSection(router) {
  /* ======================================================================
     🔒 Mini middleware d'auth local (pour le fallback inline uniquement)
     ====================================================================== */
  let verifyAuthHeader;
  try {
    verifyAuthHeader = require("../auth/_helpers").verifyAuthHeader;
  } catch {}
  function requireAuthInline(req, res, next) {
    try {
      if (!verifyAuthHeader) throw new Error("verifyAuthHeader missing");
      const a = verifyAuthHeader(req);
      if (!a || !a.userId)
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      req.auth = { userId: a.userId, role: a.role || "user" };
      next();
    } catch {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
  }

  /* ======================================================================
     🧩 Tentative de montage du VRAI router commentaires (avec fallback).
     ====================================================================== */
  let commentsRouterMounted = false;
  try {
    router.use("/communaute", require("../communaute/comments.js"));
    commentsRouterMounted = true;
  } catch (e) {
    console.warn(
      "⚠️  /communaute/comments non monté (module manquant) — fallback inline actif :",
      e?.message || e
    );
  }

  /* ======================================================================
     ✅ Fallback INLINE — activé UNIQUEMENT si le vrai router n'est pas monté.
     ====================================================================== */
  if (!commentsRouterMounted) {
    try {
      const mongoose = require("mongoose");
      const CommunityPost = require("../../models/communityPost.model");
      const CommunityComment = require("../../models/communityComment.model");
      const User = require("../../models/user.model");

      const USER_PROJECTION = {
        _id: 1,
        fullName: 1,
        name: 1,
        displayName: 1,
        avatarUrl: 1,
        photoURL: 1,
        isVerified: 1,
      };
      function normUserToAuthor(u) {
        if (!u) return null;
        const name = u.fullName || u.displayName || u.name || "";
        const avatarUrl = u.avatarUrl || u.photoURL || "";
        return {
          id: String(u._id),
          name: name || "Utilisateur",
          avatarUrl: avatarUrl || "",
          isVerified: !!u.isVerified,
        };
      }
      async function attachAuthors(items) {
        const ids = [
          ...new Set(
            (items || [])
              .map((c) => (c.authorId ? String(c.authorId) : ""))
              .filter((x) => x && mongoose.isValidObjectId(x))
          ),
        ];
        let byId = new Map();
        if (ids.length) {
          const users = await User.find({ _id: { $in: ids } })
            .select(USER_PROJECTION)
            .lean();
          byId = new Map(
            users.map((u) => [String(u._id), normUserToAuthor(u)])
          );
        }
        return (items || []).map((c) => {
          const author = byId.get(String(c.authorId || "")) || {
            id: String(c.authorId || ""),
            name: "Utilisateur",
            avatarUrl: "",
            isVerified: false,
          };
          return {
            ...c,
            author,
            authorName: author.name,
            authorFullName: author.name,
            authorAvatarUrl: author.avatarUrl,
            isVerified: !!author.isVerified,
            id: String(c._id || c.id),
          };
        });
      }

      // GET principal
      router.get("/communaute/posts/:postId/comments", async (req, res) => {
        try {
          const { postId } = req.params;

          const parentIdParam = req.query.parentId;
          const parentId =
            parentIdParam === "null" || parentIdParam == null
              ? null
              : String(parentIdParam);

          const expand = String(req.query.expand || "0") === "1";

          const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
          const limit = Math.min(
            100,
            Math.max(parseInt(String(req.query.limit || "20"), 10), 1)
          );
          const skip = (page - 1) * limit;

          const q = { postId, deletedAt: null };
          if (parentId === null) q.parentId = null;
          else if (parentId) q.parentId = parentId;

          // si on demande les replies d’un commentaire précis
          if (parentId && parentId !== "null") {
            const [rows, total] = await Promise.all([
              require("../../models/communityComment.model")
                .find(q)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
              require("../../models/communityComment.model").countDocuments(q),
            ]);
            const items = await attachAuthors(rows);
            return res.json({
              ok: true,
              data: {
                items,
                page,
                limit,
                total,
                hasMore: skip + rows.length < total,
              },
            });
          }

          // sinon comments top level
          const [rows, total] = await Promise.all([
            require("../../models/communityComment.model")
              .find(q)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            require("../../models/communityComment.model").countDocuments(q),
          ]);

          let tops = await attachAuthors(rows);

          if (!expand || tops.length === 0) {
            return res.json({
              ok: true,
              data: {
                items: tops,
                page,
                limit,
                total,
                hasMore: skip + rows.length < total,
              },
            });
          }

          const topIds = tops.map((c) => String(c._id || c.id));
          const childrenRows =
            await require("../../models/communityComment.model")
              .find({
                postId,
                deletedAt: null,
                parentId: { $in: topIds },
              })
              .sort({ createdAt: 1 })
              .lean();

          const children = await attachAuthors(childrenRows);
          const childrenByParent = new Map();
          for (const ch of children) {
            const pid = String(ch.parentId || "");
            if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
            childrenByParent.get(pid).push({
              ...ch,
              id: String(ch._id || ch.id),
              replies: undefined,
            });
          }

          tops = tops.map((t) => ({
            ...t,
            id: String(t._id || t.id),
            replies: childrenByParent.get(String(t._id || t.id)) || [],
          }));

          return res.json({
            ok: true,
            data: {
              items: tops,
              page,
              limit,
              total,
              hasMore: skip + rows.length < total,
            },
          });
        } catch (e) {
          console.error("[INLINE GET comments] ", e?.stack || e);
          return res.status(500).json({ ok: false, error: "server_error" });
        }
      });

      // POST
      router.post(
        "/communaute/posts/:postId/comments",
        requireAuthInline,
        async (req, res) => {
          try {
            const { postId } = req.params;
            const { text, parentId } = req.body || {};
            const userId = req.auth?.userId;

            if (!text || !String(text).trim()) {
              return res
                .status(400)
                .json({ ok: false, error: "text_required" });
            }

            const post = await CommunityPost.findById(postId);
            if (!post || post.deletedAt) {
              return res
                .status(404)
                .json({ ok: false, error: "post_not_found" });
            }

            const comment = await CommunityComment.create({
              postId: post._id,
              communityId: post.communityId,
              authorId: userId,
              parentId: parentId || null,
              text: String(text).trim(),
            });

            await CommunityPost.updateOne(
              { _id: post._id },
              { $inc: { commentsCount: 1 } }
            );
            if (parentId) {
              await CommunityComment.updateOne(
                { _id: parentId },
                { $inc: { repliesCount: 1 } }
              );
            }

            const enriched = (await attachAuthors([comment.toJSON()]))[0];
            return res.json({ ok: true, data: enriched });
          } catch (e) {
            console.error("[INLINE POST comments] ", e?.stack || e);
            return res.status(500).json({ ok: false, error: "server_error" });
          }
        }
      );

      // ancien /communaute/comments
      router.get("/communaute/comments", async (req, res) => {
        try {
          const postId = String(req.query.postId || "").trim();
          if (!postId)
            return res
              .status(400)
              .json({ ok: false, error: "postId_required" });

          const parentIdRaw = req.query.parentId;
          const parentId =
            parentIdRaw === "null" || parentIdRaw == null
              ? null
              : String(parentIdRaw);

          const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
          const limit = Math.min(
            100,
            Math.max(parseInt(String(req.query.limit || "20"), 10), 1)
          );
          const skip = (page - 1) * limit;

          const q = { postId, deletedAt: null };
          if (parentId === null) q.parentId = null;
          else if (parentId) q.parentId = parentId;

          const CommunityComment = require("../../models/communityComment.model");
          const [rows, total] = await Promise.all([
            CommunityComment.find(q)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            CommunityComment.countDocuments(q),
          ]);

          const items = await attachAuthors(rows);

          return res.json({
            ok: true,
            data: {
              items,
              page,
              limit,
              total,
              hasMore: skip + rows.length < total,
            },
            legacy: true,
          });
        } catch (e) {
          console.error("[LEGACY /communaute/comments] error:", e?.stack || e);
          return res.status(500).json({ ok: false, error: "server_error" });
        }
      });
    } catch (e) {
      console.error(
        "Failed to prepare inline comments endpoints:",
        e?.message || e
      );
    }
  }
};
