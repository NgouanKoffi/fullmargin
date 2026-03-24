// backend/src/routes/communaute/lives/goLive.js
const {
  requireAuth,
  assertCanManageLives,
  mapLive,
  CommunityLive,
  CommunityMember,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

/**
 * POST /api/communaute/lives/:id/go-live
 * -> démarrer un live programmé
 */
module.exports = (router) => {
  router.post("/:id/go-live", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;
    const { title, isPublic, durationMinutes, endsAt } = req.body || {};

    try {
      const live = await CommunityLive.findById(id);
      if (!live) {
        return res.status(404).json({ ok: false, error: "Live introuvable." });
      }

      const check = await assertCanManageLives(userId, live.communityId || null);
      if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

      // Modérateur si créateur ou proprio commu
      const creatorId = live.createdBy?._id || live.createdBy;
      const isModerator = !!(String(creatorId) === userId || (check.community && String(check.community.ownerId) === userId));
      if (!isModerator) {
        return res.status(403).json({ ok: false, error: "Seul le créateur ou l'administrateur peut lancer ce direct." });
      }

      if (live.status !== "scheduled") {
        return res.status(400).json({
          ok: false,
          error: "Seuls les directs programmés peuvent être démarrés.",
        });
      }

      await CommunityLive.updateMany(
        { 
          communityId: live.communityId || null, 
          status: "live",
          ...(live.communityId ? {} : { createdBy: userId })
        },
        { $set: { status: "ended", endedAt: new Date() } }
      );

      const now = new Date();

      if (title) live.title = title;
      if (typeof isPublic === "boolean") live.isPublic = isPublic;

      live.status = "live";
      if (!live.startsAt || live.startsAt > now) {
        live.startsAt = now;
      }

      if (endsAt) {
        const endDate = new Date(endsAt);
        if (endDate <= live.startsAt) {
          return res.status(400).json({
            ok: false,
            error:
              "L'heure de fin doit être strictement postérieure à l'heure de début.",
          });
        }
        live.plannedEndAt = endDate;
      } else if (durationMinutes && Number(durationMinutes) > 0) {
        live.plannedEndAt = new Date(
          now.getTime() + Number(durationMinutes) * 60000
        );
      } else if (!live.plannedEndAt) {
        live.plannedEndAt = new Date(now.getTime() + 90 * 60000);
      }

      await live.save();

      // 🔔 notif live démarré (depuis programmation)
      // 🔔 notif live démarré (aux membres)
      const members = await CommunityMember.find({
        communityId: live.communityId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ userId: 1 })
        .lean();

      const toNotify = members
        .map((m) => String(m.userId))
        .filter((uid) => uid !== userId); // on ne notifie pas l'admin lui-même

      const communityName = check.community?.name || "";

      await Promise.all(
        toNotify.map((uid) =>
          createNotif({
            userId: uid,
            kind: "community_live_started",
            communityId: String(live.communityId),
            payload: {
              liveId: String(live._id),
              communityName,
              fromUserName: "L'admin", // on considère que c'est l'admin
              title: live.title,
              isPublic: !!live.isPublic,
              startsAt: live.startsAt,
              plannedEndAt: live.plannedEndAt,
            },
          })
        )
      );

      // ✅ IMPORTANT: passer userId -> isOwner devient fiable côté front
      return res.json({ ok: true, data: { live: mapLive(live, userId) } });
    } catch (e) {
      console.error("[LIVES] POST /:id/go-live ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de démarrer ce live.",
      });
    }
  });
};
