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

  router.post("/:id/request-deletion", requireAuth, async (req, res) => {
    try {
      const c = await Community.findOne({ _id: req.params.id, deletedAt: null });
      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

      if (String(c.ownerId) !== String(req.auth.userId))
        return res.status(403).json({ ok: false, error: "Interdit" });

      if (c.status === "deletion_requested" || c.status === "deleted_by_admin" || c.status === "deleted_by_owner") {
        return res.status(400).json({ ok: false, error: "Demande déjà en cours ou communauté déjà supprimée" });
      }

      c.status = "deletion_requested";
      c.deletionReason = req.body.reason || "";
      await c.save();

      const User = require("../../../models/user.model");
      const { createNotif } = require("../../../utils/notifications");
      
      // On n'envoie qu'aux admins qui ont la permission "communautes"
      const admins = await User.find({ 
        roles: "admin",
        adminPermissions: "communautes" 
      }).select("_id").lean();

      // On récupère aussi le nom du demandeur pour la notif
      const requester = await User.findById(req.auth.userId).select("fullName").lean();
      
      for (const admin of admins) {
        await createNotif({
          userId: admin._id,
          kind: "community_deletion_requested",
          communityId: c._id,
          payload: { 
            reason: c.deletionReason, 
            communityName: c.name,
            ownerName: requester?.fullName || "Un propriétaire"
          }
        });
      }

      return res.json({ ok: true, message: "Demande de suppression envoyée." });
    } catch (e) {
      console.error("[COMMUNITY DELETE REQ]", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });

  router.post("/:id/request-restoration", requireAuth, async (req, res) => {
    try {
      const c = await Community.findOne({ _id: req.params.id });
      if (!c) return res.status(404).json({ ok: false, error: "Introuvable" });

      if (String(c.ownerId) !== String(req.auth.userId))
        return res.status(403).json({ ok: false, error: "Interdit" });

      if (c.status === "active" && !c.deletedAt) {
        return res.status(400).json({ ok: false, error: "Communauté déjà active" });
      }

      const User = require("../../../models/user.model");
      const { createNotif } = require("../../../utils/notifications");
      
      // On n'envoie qu'aux admins qui ont la permission "communautes"
      const admins = await User.find({ 
        roles: "admin",
        adminPermissions: "communautes" 
      }).select("_id").lean();

      const requester = await User.findById(req.auth.userId).select("fullName").lean();

      for (const admin of admins) {
        await createNotif({
          userId: admin._id,
          kind: "community_restoration_requested",
          communityId: c._id,
          payload: { 
            communityName: c.name,
            ownerName: requester?.fullName || "Un propriétaire"
          }
        });
      }

      return res.json({ ok: true, message: "Demande de restauration envoyée aux administrateurs." });
    } catch (e) {
      console.error("[COMMUNITY RESTORE REQ]", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  });
};
