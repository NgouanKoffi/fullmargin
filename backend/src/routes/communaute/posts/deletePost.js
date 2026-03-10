// backend/src/routes/communaute/posts/deletePost.js
const { Community, CommunityPost, createNotif } = require("./_shared");

module.exports = async function deletePost(req, res) {
  try {
    const postId = req.params.id;

    // 1) Soft delete du post
    await CommunityPost.updateOne(
      { _id: postId },
      { $set: { deletedAt: new Date() } }
    );

    // 2) Décrémenter le compteur de posts de la communauté
    if (req.post?.communityId) {
      await Community.updateOne(
        { _id: req.post.communityId },
        { $inc: { postsCount: -1 } }
      );
    }

    // 3) Notifier l'auteur si ce n'est pas lui qui supprime
    if (
      req.post &&
      String(req.post.authorId) !== String(req.auth.userId) &&
      req.post.authorId
    ) {
      await createNotif({
        userId: req.post.authorId,
        kind: "community_post_deleted_by_admin",
        communityId: req.post.communityId,
        payload: {
          postId: String(req.post._id),
          deletedBy: String(req.auth.userId),
          communityName: req.community?.name || "",
        },
      });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("[POSTS] delete ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
};
