const { requireAuth, Community } = require("./_shared");

module.exports = (router) => {
  router.get("/:id/settings", requireAuth, async (req, res) => {
    try {
      const c = await Community.findOne({
        _id: req.params.id,
        deletedAt: null,
      })
        .select({ allowSubscribersPosts: 1, ownerId: 1 })
        .lean();

      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

      if (String(c.ownerId) !== String(req.auth.userId))
        return res.status(403).json({ ok: false, error: "Interdit" });

      return res.json({
        ok: true,
        data: { allowSubscribersPosts: Boolean(c.allowSubscribersPosts) },
      });
    } catch {
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });

  router.patch("/:id/settings", requireAuth, async (req, res) => {
    try {
      const { allowSubscribersPosts } = req.body;

      const c = await Community.findOne({
        _id: req.params.id,
        deletedAt: null,
      });

      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

      if (String(c.ownerId) !== String(req.auth.userId))
        return res.status(403).json({ ok: false, error: "Interdit" });

      if (typeof allowSubscribersPosts === "boolean") {
        c.allowSubscribersPosts = allowSubscribersPosts;
      }

      await c.save();

      return res.json({
        ok: true,
        data: { allowSubscribersPosts: c.allowSubscribersPosts },
      });
    } catch {
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });
};
