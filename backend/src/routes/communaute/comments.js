// backend/src/routes/communaute/comments.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Community = require("../../models/community.model");
const CommunityPost = require("../../models/communityPost.model");
const CommunityComment = require("../../models/communityComment.model");
const User = require("../../models/user.model");
const { createNotif } = require("../../utils/notifications"); // 👈 ajouté

/* ------------------------------------------------------------------
   ✅ Auth locale SANS ../../utils/auth
   On lit le header Authorization via ../auth/_helpers (existe déjà).
------------------------------------------------------------------- */
function ensureAuth(req, res, next) {
  try {
    // Si un middleware amont a déjà mis req.user
    if (req.user?.id) return next();

    // Sinon, on vérifie ici
    const { verifyAuthHeader } = require("../auth/_helpers");
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });

    req.user = { id: a.userId, role: a.role || "user" };
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* -------------------------- Normalisation auteur -------------------------- */
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

async function attachAuthorsFlat(items) {
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
    byId = new Map(users.map((u) => [String(u._id), normUserToAuthor(u)]));
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

/* --------------------------- Helpers d’arbre --------------------------- */
function buildTree(all, roots, depthMax = 2) {
  const byParent = new Map();
  for (const c of all) {
    const pid = c.parentId ? String(c.parentId) : null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(c);
  }
  const attach = (node, depth) => {
    if (depth >= depthMax) return node;
    const kids = byParent.get(String(node.id)) || [];
    return { ...node, replies: kids.map((k) => attach(k, depth + 1)) };
  };
  return roots.map((r) => attach(r, 1));
}

/* ----------------------------------- GET -----------------------------------
   Comportement :
   - parentId fourni (id réel)   -> liste plate des réponses de ce parent
   - parentId = null (ou absent) -> renvoie un ARBRE imbriqué (par défaut 2 niveaux)
---------------------------------------------------------------------------- */
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
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
    const nestDepth = Math.max(
      1,
      Math.min(parseInt(String(req.query.nestDepth || "2"), 10), 4)
    );

    // 🔹 Cas “réponses d’un parent précis” → liste plate
    if (parentId) {
      const skip = (page - 1) * limit;
      const q = { postId, deletedAt: null, parentId };
      const [rows, total] = await Promise.all([
        CommunityComment.find(q)
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CommunityComment.countDocuments(q),
      ]);
      const items = await attachAuthorsFlat(rows);
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

    // 🔹 Top-level → on renvoie un ARBRE (réponses incluses) pour survivre au refresh
    const skip = (page - 1) * limit;
    const topQuery = { postId, deletedAt: null, parentId: null };
    const [topRows, topTotal] = await Promise.all([
      CommunityComment.find(topQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityComment.countDocuments(topQuery),
    ]);

    // niveau 1 (réponses directes)
    const topIds = topRows.map((r) => String(r._id));
    const lvl1 = topIds.length
      ? await CommunityComment.find({
          postId,
          deletedAt: null,
          parentId: { $in: topIds },
        })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    // niveau 2 (réponses aux réponses)
    const lvl1Ids = lvl1.map((r) => String(r._id));
    const lvl2 =
      nestDepth >= 3 && lvl1Ids.length
        ? await CommunityComment.find({
            postId,
            deletedAt: null,
            parentId: { $in: lvl1Ids },
          })
            .sort({ createdAt: 1 })
            .lean()
        : [];

    // niveau 3 (optionnel)
    const lvl2Ids = lvl2.map((r) => String(r._id));
    const lvl3 =
      nestDepth >= 4 && lvl2Ids.length
        ? await CommunityComment.find({
            postId,
            deletedAt: null,
            parentId: { $in: lvl2Ids },
          })
            .sort({ createdAt: 1 })
            .lean()
        : [];

    const enriched = await attachAuthorsFlat([
      ...topRows,
      ...lvl1,
      ...lvl2,
      ...lvl3,
    ]);
    const byId = new Map(enriched.map((e) => [String(e.id), e]));
    const tops = topRows.map((r) => byId.get(String(r._id)));
    const tree = buildTree(enriched, tops, nestDepth);

    return res.json({
      ok: true,
      data: {
        items: tree,
        page,
        limit,
        total: topTotal,
        hasMore: skip + topRows.length < topTotal,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/* ---------------------------------- POST ---------------------------------- */
router.post("/posts/:postId/comments", ensureAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body || {};
    const userId = req.user?.id;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ ok: false, error: "text_required" });
    }

    const post = await CommunityPost.findById(postId).lean();
    if (!post || post.deletedAt) {
      return res.status(404).json({ ok: false, error: "post_not_found" });
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

    // 👇 on récupère le nom de celui qui commente pour le mettre dans le payload
    const actor = await User.findOne({ _id: userId })
      .select({ fullName: 1 })
      .lean();

    // 🔔 notif 1 : au propriétaire du post (si ce n’est pas lui qui commente)
    if (String(post.authorId) !== String(userId)) {
      await createNotif({
        userId: post.authorId,
        kind: "community_post_commented",
        communityId: post.communityId,
        payload: {
          postId: post._id,
          fromUserId: userId,
          fromUserName: actor?.fullName || "", // 👈 vrai nom
          parentCommentId: parentId || null,
        },
      });
    }

    // 🔔 notif 2 : si c’est une réponse à un commentaire → au propriétaire du commentaire
    if (parentId) {
      const parent = await CommunityComment.findById(parentId)
        .select({ authorId: 1 })
        .lean();
      if (
        parent &&
        String(parent.authorId) !== String(userId) && // on ne se notifie pas soi-même
        String(parent.authorId) !== String(post.authorId) // on évite le doublon
      ) {
        await createNotif({
          userId: parent.authorId,
          kind: "community_comment_replied",
          communityId: post.communityId,
          payload: {
            postId: post._id,
            commentId: comment._id,
            parentCommentId: parentId,
            fromUserId: userId,
            fromUserName: actor?.fullName || "", // 👈 vrai nom ici aussi
          },
        });
      }
    }

    // enrich one
    const enriched = (await attachAuthorsFlat([comment.toJSON()]))[0];
    const data = {
      id: String(enriched.id),
      text: enriched.text,
      createdAt: enriched.createdAt,
      author: enriched.author,
    };
    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/* --------------------------------- PATCH --------------------------------- */
router.patch("/comments/:commentId", ensureAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body || {};
    const userId = req.user?.id;

    const comment = await CommunityComment.findById(commentId);
    if (!comment || comment.deletedAt) {
      return res.status(404).json({ ok: false, error: "comment_not_found" });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ ok: false, error: "text_required" });
    }
    if (!(userId && String(comment.authorId) === String(userId))) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    comment.text = String(text).trim();
    await comment.save();

    const enriched = (await attachAuthorsFlat([comment.toJSON()]))[0];
    const data = {
      id: String(enriched.id),
      text: enriched.text,
      createdAt: enriched.createdAt,
      author: enriched.author,
    };
    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/* --------------------------------- DELETE --------------------------------- */
router.delete("/comments/:commentId", ensureAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const comment = await CommunityComment.findById(commentId).lean();
    if (!comment || comment.deletedAt) {
      return res.status(404).json({ ok: false, error: "comment_not_found" });
    }
    // auteur, auteur du post, ou owner de la communauté → autorisé
    const allowed = await (async () => {
      if (String(comment.authorId) === String(userId)) return true;
      const post = await CommunityPost.findById(comment.postId)
        .select({ authorId: 1, communityId: 1 })
        .lean();
      if (!post) return false;
      if (String(post.authorId) === String(userId)) return true;
      const community = await Community.findById(post.communityId)
        .select({ ownerId: 1 })
        .lean();
      return community && String(community.ownerId) === String(userId);
    })();
    if (!allowed) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    // on récupère le post pour mettre à jour le compteur + pour la notif
    const post = await CommunityPost.findById(comment.postId)
      .select({ _id: 1, communityId: 1 })
      .lean();

    await CommunityComment.updateOne(
      { _id: commentId },
      { $set: { deletedAt: new Date() } }
    );

    if (post) {
      await CommunityPost.updateOne(
        { _id: post._id },
        { $inc: { commentsCount: -1 } }
      );
    }
    if (comment.parentId) {
      await CommunityComment.updateOne(
        { _id: comment.parentId },
        { $inc: { repliesCount: -1 } }
      );
    }

    // 🔔 notif : si quelqu’un d’autre supprime mon commentaire → je suis notifié
    if (String(comment.authorId) !== String(userId)) {
      await createNotif({
        userId: comment.authorId,
        kind: "community_comment_deleted",
        communityId: post ? post.communityId : null,
        payload: {
          commentId: comment._id,
          postId: comment.postId,
          deletedBy: userId,
        },
      });
    }

    return res.json({ ok: true, data: { id: String(commentId) } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
