// backend/src/utils/notifications.js
const Notification = require("../models/notification.model");

/**
 * Crée une notification sans faire planter la requête appelante.
 * @param {Object} params
 * @param {string} params.userId - destinataire
 * @param {string} params.kind - type de notif (ex: "community_member_joined", "discussion_message")
 * @param {string|null} [params.communityId]
 * @param {string|null} [params.requestId]
 * @param {string|null} [params.groupId]
 * @param {string|null} [params.courseId]
 * @param {Object} [params.payload]
 */
async function createNotif({
  userId,
  kind,
  communityId = null,
  requestId = null,
  groupId = null,
  courseId = null,
  payload = {},
}) {
  if (!userId || !kind) return;
  try {
    await Notification.create({
      userId,
      kind,
      communityId,
      requestId,
      groupId,
      courseId,
      payload,
      seen: false,
    });
  } catch (e) {
    // la notif ne doit jamais casser l'action principale
    console.error("[NOTIF] create failed:", e?.message || e);
  }
}

/**
 * Marque plusieurs notifs "vues" pour un user.
 * On peut soit passer des ids, soit ajouter un filtre extra (ex: par threadKey).
 *
 * @param {string} userId
 * @param {Array<string>} [ids]
 * @param {Object} [extraFilter]
 */
async function markNotifsSeen(userId, ids = [], extraFilter = {}) {
  if (!userId) return;

  const filter = {
    userId,
    seen: false,
    ...extraFilter,
  };

  if (Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  try {
    await Notification.updateMany(filter, { $set: { seen: true } });
  } catch (e) {
    console.error("[NOTIF] mark seen failed:", e?.message || e);
  }
}

module.exports = {
  createNotif,
  markNotifsSeen,
};
