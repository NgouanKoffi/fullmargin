// backend/src/routes/communaute/lives/update.js
const {
  requireAuth,
  assertIsOwner,
  mapLive,
  CommunityLive,
} = require("./_shared");

/**
 * POST /api/communaute/lives/:id/update
 * -> modifier un live programmé
 */
module.exports = (router) => {
  router.post("/:id/update", requireAuth, async (req, res) => {
    const userId = String(req.auth.userId);
    const { id } = req.params;
    const { title, startsAt, endsAt, isPublic } = req.body || {};

    try {
      const live = await CommunityLive.findById(id);
      if (!live) {
        return res.status(404).json({ ok: false, error: "Live introuvable." });
      }

      const check = await assertIsOwner(userId, String(live.communityId));
      if (!check.ok) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      if (live.status !== "scheduled") {
        return res.status(400).json({
          ok: false,
          error: "Seuls les directs programmés peuvent être modifiés.",
        });
      }

      if (title) live.title = title;
      if (typeof isPublic === "boolean") live.isPublic = isPublic;

      if (startsAt) {
        const startDate = new Date(startsAt);
        live.startsAt = startDate;

        if (endsAt) {
          const endDate = new Date(endsAt);
          if (endDate <= startDate) {
            return res.status(400).json({
              ok: false,
              error:
                "L'heure de fin doit être strictement postérieure à l'heure de début.",
            });
          }
          live.plannedEndAt = endDate;
        } else if (!live.plannedEndAt) {
          live.plannedEndAt = new Date(startDate.getTime() + 60 * 60000);
        }
      } else if (endsAt) {
        const endDate = new Date(endsAt);
        if (live.startsAt && endDate <= live.startsAt) {
          return res.status(400).json({
            ok: false,
            error:
              "L'heure de fin doit être strictement postérieure à l'heure de début.",
          });
        }
        live.plannedEndAt = endDate;
      }

      await live.save();

      // ✅ IMPORTANT : passer userId -> isOwner fiable
      return res.json({ ok: true, data: { live: mapLive(live, userId) } });
    } catch (e) {
      console.error("[LIVES] POST /:id/update ERROR:", e);
      return res.status(500).json({
        ok: false,
        error: "Impossible de modifier ce live.",
      });
    }
  });
};
