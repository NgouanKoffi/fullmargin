const { Community, CommunityPost } = require("./_shared");

module.exports = async function patchPost(req, res) {
  try {
    const { content = "", scheduledAt, visibility } = req.body || {};
    const set = {};

    // ✏️ contenu
    if (typeof content === "string") {
      set.content = String(content).trim().slice(0, 10000);
      set.isEdited = true;
      set.editedAt = new Date();
    }

    // 🔐 visibilité (private | public)
    if (visibility !== undefined) {
      if (visibility === "public" || visibility === "private") {
        set.visibility = visibility;
      }
    }

    // ⏰ programmation
    if (scheduledAt !== undefined) {
      const community = await Community.findOne({ _id: req.post.communityId })
        .select({ ownerId: 1 })
        .lean();
      const isOwner =
        community && String(community.ownerId) === String(req.auth.userId);
      if (!isOwner) {
        return res
          .status(403)
          .json({ ok: false, error: "Seul le propriétaire peut programmer" });
      }

      if (scheduledAt === "" || scheduledAt === null) {
        set.isPublished = true;
        set.scheduledAt = null;
        set.publishedAt = new Date();
      } else {
        const dt = new Date(String(scheduledAt));
        if (isNaN(dt.getTime()) || dt.getTime() < Date.now() + 60 * 1000) {
          return res
            .status(400)
            .json({ ok: false, error: "Date de programmation invalide" });
        }
        set.isPublished = false;
        set.scheduledAt = dt;
        set.publishedAt = null;
      }
    }

    if (!Object.keys(set).length) {
      return res.json({ ok: true, data: req.post });
    }

    await CommunityPost.updateOne({ _id: req.params.id }, { $set: set });
    const updated = await CommunityPost.findById(req.params.id).lean();

    return res.json({
      ok: true,
      data: { ...updated, id: String(updated._id) },
    });
  } catch (e) {
    console.error("[POSTS] patch ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Mise à jour impossible" });
  }
};
