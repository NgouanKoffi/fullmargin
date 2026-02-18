// backend/src/routes/communaute/posts/likes.js
const {
  Community,
  CommunityPost,
  CommunityPostLike,
  User,
  createNotif,
} = require("./_shared");

async function ensureLikeIndexes() {
  try {
    await CommunityPostLike.init();
  } catch {}
}

async function likePost(req, res) {
  try {
    await ensureLikeIndexes();
    const { id } = req.params;
    const userId = String(req.auth.userId);

    const post = await CommunityPost.findOne({ _id: id, deletedAt: null })
      .select({ _id: 1, communityId: 1, authorId: 1, isPublished: 1 })
      .lean();

    if (!post)
      return res.status(404).json({ ok: false, error: "Post introuvable" });
    if (post.isPublished === false) {
      return res
        .status(400)
        .json({ ok: false, error: "Le post n’est pas encore publié" });
    }

    const up = await CommunityPostLike.updateOne(
      { postId: id, userId },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    if (up.upsertedCount === 1) {
      await CommunityPost.updateOne({ _id: id }, { $inc: { likesCount: 1 } });
      if (post.communityId) {
        await Community.updateOne(
          { _id: post.communityId },
          { $inc: { likesCount: 1 } }
        ).catch(() => {});
      }

      if (String(post.authorId) !== String(userId)) {
        const liker = await User.findOne({ _id: userId })
          .select({ fullName: 1 })
          .lean();

        await createNotif({
          userId: post.authorId,
          kind: "community_post_liked",
          communityId: post.communityId,
          payload: {
            postId: post._id,
            fromUserId: userId,
            fromUserName: liker?.fullName || "",
          },
        });
      }
    }

    const fresh = await CommunityPostLike.countDocuments({ postId: id });
    return res.json({ ok: true, data: { liked: true, likes: fresh } });
  } catch (e) {
    console.error("[POSTS] like POST ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
}

async function unlikePost(req, res) {
  try {
    await ensureLikeIndexes();
    const { id } = req.params;
    const userId = String(req.auth.userId);

    const post = await CommunityPost.findOne({ _id: id, deletedAt: null })
      .select({ _id: 1, communityId: 1 })
      .lean();
    if (!post)
      return res.status(404).json({ ok: false, error: "Post introuvable" });

    const del = await CommunityPostLike.deleteOne({ postId: id, userId });
    if (del.deletedCount === 1) {
      await CommunityPost.updateOne(
        { _id: id, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } }
      );
      if (post.communityId) {
        await Community.updateOne(
          { _id: post.communityId, likesCount: { $gt: 0 } },
          { $inc: { likesCount: -1 } }
        ).catch(() => {});
      }
    }

    const fresh = await CommunityPostLike.countDocuments({ postId: id });
    return res.json({ ok: true, data: { liked: false, likes: fresh } });
  } catch (e) {
    console.error("[POSTS] like DELETE ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
}

module.exports = { likePost, unlikePost };
