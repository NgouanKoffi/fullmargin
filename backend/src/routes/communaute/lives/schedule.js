// backend/src/routes/communaute/lives/schedule.js
const {
  requireAuth,
  assertCanManageLives,
  mapLive,
  CommunityLive,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

/**
 * POST /api/communaute/lives/schedule
 * body: { communityId, title, description?, startsAt, endsAt?, isPublic? }
 */
module.exports = (router) => {
  router.post("/schedule", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const {
      communityId,
      title,
      description,
      startsAt,
      endsAt,
      isPublic = false,
    } = req.body || {};

    if (!communityId || !title || !startsAt) {
      return res.status(400).json({
        ok: false,
        error: "communityId, title et startsAt sont requis.",
      });
    }

    const check = await assertCanManageLives(userId, communityId || null);
    if (!check.ok) {
      return res.status(403).json({ ok: false, error: check.error });
    }

    try {
      const startDate = new Date(startsAt);
      let plannedEndAt = null;

      if (endsAt) {
        const endDate = new Date(endsAt);
        if (endDate <= startDate) {
          return res.status(400).json({
            ok: false,
            error:
              "L'heure de fin doit être strictement postérieure à l'heure de début.",
          });
        }
        plannedEndAt = endDate;
      } else {
        plannedEndAt = new Date(startDate.getTime() + 60 * 60000);
      }

      const roomName = `fm_${communityId}_${Date.now()}`;

      const live = await CommunityLive.create({
        communityId: check.community ? communityId : null,
        title,
        description: description || "",
        status: "scheduled",
        startsAt: startDate,
        plannedEndAt,
        createdBy: userId,
        roomName,
        isPublic: !!isPublic,
      });

      // 🔔 notif live programmé
      if (communityId && check.community) {
        await createNotif({
          userId,
          kind: "live_scheduled",
          communityId: String(communityId),
          payload: {
            liveId: String(live._id),
            title: live.title,
            startsAt: live.startsAt,
            plannedEndAt: live.plannedEndAt,
            isPublic: !!live.isPublic,
          },
        });
      }

      return res.json({
        ok: true,
        data: {
          // ✅ IMPORTANT : passer userId -> isOwner fiable
          live: mapLive(live, userId),
        },
      });
    } catch (e) {
      console.error("[LIVES] POST /schedule ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de programmer le direct.",
      });
    }
  });
};
