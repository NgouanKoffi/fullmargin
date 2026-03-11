// backend/src/routes/communaute/lives/startFast.js
const {
  requireAuth,
  mapLive,
  Community,
  CommunityLive,
  User,
} = require("./_shared");

/**
 * POST /api/communaute/lives/start-fast
 * Automatically find or create a community for the user and start a live.
 */
module.exports = (router) => {
  router.post("/start-fast", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);

    try {
      // 1. Chercher si l'utilisateur possède déjà une communauté
      let community = await Community.findOne({
        ownerId: userId,
        status: "active",
        deletedAt: null,
      });

      // 2. Si non, on lui en crée une par défaut (Espace Personnel)
      if (!community) {
        const user = await User.findById(userId);
        const userName = user?.fullName || "Utilisateur";
        // On génère un slug unique basé sur l'ID et un timestamp court
        const shortId = Date.now().toString(36).slice(-4);
        
        community = await Community.create({
          name: `Espace de ${userName}`,
          nameLower: `espace de ${userName}`.toLowerCase(),
          slug: `espace-${userId.slice(-5)}-${shortId}`,
          category: "communautes_coaching",
          visibility: "private",
          ownerId: userId,
        });
      }

      const communityId = community._id;

      // 3. On ferme proprement les lives encore "live" de cette communauté pour éviter les conflits
      await CommunityLive.updateMany(
        { communityId, status: "live" },
        { $set: { status: "ended", endedAt: new Date() } },
      );

      // 4. Création du live instantané
      const now = new Date();
      // Fin programmée à +2h par défaut
      const plannedEndAt = new Date(now.getTime() + 120 * 60000);

      const title = `Direct du ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString(
        "fr-FR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;

      // Slugifie pour Jitsi
      const safeBase = community.name
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "live";

      const liveShortId = Date.now().toString(36).slice(-6);
      const roomName = `fm-${safeBase}-${liveShortId}`;

      const live = await CommunityLive.create({
        communityId,
        title,
        description: "",
        status: "live",
        startsAt: now,
        plannedEndAt,
        createdBy: userId,
        roomName,
        isPublic: true,
      });

      return res.json({
        ok: true,
        data: {
          live: mapLive(live, userId),
        },
      });
    } catch (e) {
      console.error("[LIVES] POST /start-fast ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de lancer le direct instantané.",
      });
    }
  });
};
