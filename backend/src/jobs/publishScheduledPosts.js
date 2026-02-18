// backend/src/jobs/publishScheduledPosts.js
// Publie tous les posts programmés dont l'heure est passée.
// Appelé au boot puis à intervalle régulier.

const CommunityPost = require("../models/communityPost.model");
const Community = require("../models/community.model");
const CommunityMember = require("../models/communityMember.model");
const User = require("../models/user.model");
const { createNotif } = require("../utils/notifications");

async function publishDuePostsOnce(logger = console) {
  const now = new Date();
  try {
    // 1) Trouver les posts à publier AVANT de les mettre à jour
    //    (pour pouvoir envoyer les notifications)
    const duePosts = await CommunityPost.find({
      deletedAt: null,
      isPublished: false,
      scheduledAt: { $lte: now },
    })
      .select({ _id: 1, communityId: 1, authorId: 1 })
      .lean();

    if (duePosts.length === 0) return;

    // 2) Mettre à jour les posts
    await CommunityPost.updateMany(
      { _id: { $in: duePosts.map((p) => p._id) } },
      {
        $set: {
          isPublished: true,
          publishedAt: now,
          scheduledAt: null,
        },
      }
    );

    logger.log(
      `[scheduler] ${duePosts.length} post(s) publiés à ${now.toISOString()}`
    );

    // 3) Envoyer les notifications pour chaque post publié
    for (const post of duePosts) {
      try {
        const community = await Community.findOne({
          _id: post.communityId,
          deletedAt: null,
        })
          .select({ _id: 1, ownerId: 1, name: 1 })
          .lean();

        if (!community) continue;

        const author = await User.findOne({ _id: post.authorId })
          .select({ _id: 1, fullName: 1 })
          .lean();

        const members = await CommunityMember.find({
          communityId: community._id,
          $or: [{ status: "active" }, { status: { $exists: false } }],
        })
          .select({ userId: 1 })
          .lean();

        const ownerId = String(community.ownerId);
        const authorId = String(post.authorId);
        const isOwnerPost = ownerId === authorId;

        const toNotify = members
          .map((m) => String(m.userId))
          .filter((uid) => uid !== authorId);

        // Si c'est un post du owner → kind = community_post_created_admin
        // Si c'est un post d'un abonné → kind = community_post_created (+ notifier l'owner)
        const kind = isOwnerPost
          ? "community_post_created_admin"
          : "community_post_created";

        // Si l'auteur n'est pas l'owner, ajouter l'owner dans les destinataires
        const targetIds = new Set(toNotify);
        if (!isOwnerPost && ownerId) {
          targetIds.add(ownerId);
        }
        targetIds.delete(authorId);

        await Promise.all(
          Array.from(targetIds).map((uid) =>
            createNotif({
              userId: uid,
              kind,
              communityId: community._id,
              payload: {
                postId: String(post._id),
                communityName: community.name || "",
                fromUserId: authorId,
                fromUserName: author?.fullName || "",
              },
            })
          )
        );
      } catch (notifErr) {
        logger.error(
          "[scheduler] erreur notification post:",
          post._id,
          notifErr?.message || notifErr
        );
      }
    }
  } catch (e) {
    logger.error("[scheduler] erreur publishDuePostsOnce:", e?.stack || e);
  }
}

function startPublishScheduler({ intervalMs = 30_000, logger = console } = {}) {
  // premier passage au boot
  publishDuePostsOnce(logger).catch(() => {});
  // boucle
  return setInterval(() => publishDuePostsOnce(logger), intervalMs);
}

module.exports = { startPublishScheduler, publishDuePostsOnce };
