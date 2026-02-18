// backend/src/routes/communaute/lives/startNow.js
const {
  requireAuth,
  assertIsOwner,
  mapLive,
  CommunityLive,
  CommunityMember,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

/**
 * POST /api/communaute/lives/start-now
 * body: { communityId, title?, description?, isPublic?, durationMinutes?, endsAt? }
 */
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
      return res
        .status(400)
        .json({ ok: false, error: "communityId requis dans le body." });
    }

    const check = await assertIsOwner(userId, communityId);
    if (!check.ok) {
      return res.status(403).json({ ok: false, error: check.error });
    }

    const community = check.community;

    try {
      // On ferme proprement les lives encore "live" de cette communauté
      await CommunityLive.updateMany(
        { communityId, status: "live" },
        { $set: { status: "ended", endedAt: new Date() } }
      );

      const now = new Date();
      let plannedEndAt = null;

      if (endsAt) {
        plannedEndAt = new Date(endsAt);
      } else if (durationMinutes && Number(durationMinutes) > 0) {
        plannedEndAt = new Date(
          now.getTime() + Number(durationMinutes) * 60000
        );
      } else {
        plannedEndAt = new Date(now.getTime() + 90 * 60000);
      }

      // ----- Titre “officiel” du live -----
      const finalTitle =
        title ||
        `Live du ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )}`;

      // ----- Nom de salle Jitsi lisible (ce que voient les membres) -----
      const baseForRoom = title || community?.name || "FullMargin Live";

      // on “slugifie” pour Jitsi : minuscules, tirets, pas d'accents
      const safeBase =
        baseForRoom
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // enlever accents
          .replace(/[^a-zA-Z0-9]+/g, "-") // tout le reste -> tirets
          .replace(/^-+|-+$/g, "") // pas de tirets en début/fin
          .toLowerCase() || "live";

      const shortId = Date.now().toString(36).slice(-6);
      const roomName = `fm-${safeBase}-${shortId}`;

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

      // 🔔 notif live démarré
      // 🔔 notif live démarré (aux membres)
      const members = await CommunityMember.find({
        communityId,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ userId: 1 })
        .lean();

      const toNotify = members
        .map((m) => String(m.userId))
        .filter((uid) => uid !== userId);

      await Promise.all(
        toNotify.map((uid) =>
          createNotif({
            userId: uid,
            kind: "community_live_started",
            communityId: String(communityId),
            payload: {
              liveId: String(live._id),
              communityName: community?.name || "",
              fromUserName: "L'admin",
              title: live.title,
              isPublic: !!live.isPublic,
              startsAt: live.startsAt,
              plannedEndAt: live.plannedEndAt,
            },
          })
        )
      );

      return res.json({
        ok: true,
        data: {
          // ✅ IMPORTANT : passer userId -> isOwner fiable
          live: mapLive(live, userId),
        },
      });
    } catch (e) {
      console.error("[LIVES] POST /start-now ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de lancer le direct.",
      });
    }
  });
};
