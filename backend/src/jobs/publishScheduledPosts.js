// backend/src/jobs/publishScheduledPosts.js
// Publie tous les posts programmés dont l'heure est passée.
// Appelé au boot puis à intervalle régulier.

const CommunityPost = require("../models/communityPost.model");

async function publishDuePostsOnce(logger = console) {
  const now = new Date();
  try {
    const res = await CommunityPost.updateMany(
      {
        deletedAt: null,
        isPublished: false,
        scheduledAt: { $lte: now },
      },
      {
        $set: {
          isPublished: true,
          publishedAt: now,
          scheduledAt: null,
        },
      }
    );
    if (res.modifiedCount > 0) {
      logger.log(
        `[scheduler] ${
          res.modifiedCount
        } post(s) publiés à ${now.toISOString()}`
      );
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
