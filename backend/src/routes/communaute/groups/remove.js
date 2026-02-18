// backend/src/routes/communaute/groups/remove.js
const { clampStr, requireAuth, makeRid, CommunityGroup } = require("./_shared");

/**
 * DELETE /api/communaute/groups/:id
 */
module.exports = (router) => {
  router.delete("/:id", requireAuth, async (req, res) => {
    const rid = makeRid(req);
    try {
      const userId = req.auth.userId;
      const groupId = clampStr(req.params.id, 80);

      const group = await CommunityGroup.findOne({
        _id: groupId,
        deletedAt: null,
      });
      if (!group) {
        return res.status(404).json({ ok: false, error: "Groupe introuvable" });
      }

      if (String(group.owner) !== String(userId)) {
        return res.status(403).json({ ok: false, error: "Accès refusé" });
      }

      group.deletedAt = new Date();
      await group.save();

      return res.status(200).json({ ok: true, data: { deleted: true } });
    } catch (e) {
      console.error(
        `[GROUPS ${rid}] DELETE /groups/:id ERROR: ${e?.stack || e}`
      );
      return res.status(500).json({
        ok: false,
        error: "Suppression du groupe impossible",
      });
    }
  });
};
