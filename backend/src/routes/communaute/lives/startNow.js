// backend/src/routes/communaute/lives/startNow.js
const {
  requireAuth,
  assertIsOwner,
  mapLive,
  CommunityLive,
  CommunityMember,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

module.exports = (router) => {
  router.post("/start-now", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const {
      communityId,
      title,
      description,
      isPublic = false,
      durationMinutes,
      endsAt,
    } = req.body || {};

    if (!communityId) {
      return res.status(400).json({ ok: false, error: "communityId requis dans le body." });
    }

    const check = await assertIsOwner(userId, communityId);
    if (!check.ok) return res.status(403).json({ ok: false, error: check.error });

    const community = check.community;

    try {
      await CommunityLive.updateMany(
        { communityId, status: "live" },
        { $set: { status: "ended", endedAt: new Date() } },
      );

      const now = new Date();
      let plannedEndAt = null;

      if (endsAt) {
        plannedEndAt = new Date(endsAt);
      } else if (durationMinutes && Number(durationMinutes) > 0) {
        plannedEndAt = new Date(now.getTime() + Number(durationMinutes) * 60000);
      } else {
        plannedEndAt = new Date(now.getTime() + 90 * 60000);
      }

      const finalTitle = title || `Live du ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

      // 🔴 ID DE SALLE PROPRE : Minuscules et chiffres uniquement, court, Jitsi ne plantera plus dessus
      const shortId = Date.now().toString(36).toLowerCase();
      const roomName = `fmlive${shortId}`; 

      const live = await CommunityLive.create({
        communityId,
        title: finalTitle,
        description: description || "",
        status: "live",
        startsAt: now,
        plannedEndAt,
        createdBy: userId,
        roomName, 
        isPublic: !!isPublic,
      });

      const members = await CommunityMember.find({
        communityId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }).select({ userId: 1 }).lean();

      const toNotify = members.map((m) => String(m.userId)).filter((uid) => uid !== userId);

      await Promise.all(
        toNotify.map((uid) =>
          createNotif({
            userId: uid,
            kind: "community_live_started",
            communityId: String(communityId),
            payload: {
              liveId: String(live._id),
              communityName: community?.name || "",
              title: live.title,
              isPublic: !!live.isPublic,
              startsAt: live.startsAt,
              plannedEndAt: live.plannedEndAt,
            },
          }),
        ),
      );

      return res.json({ ok: true, data: { live: mapLive(live, userId) } });
    } catch (e) {
      console.error("[LIVES] POST /start-now ERROR:", e);
      return res.status(500).json({ ok: false, error: "Impossible de lancer le direct." });
    }
  });
};