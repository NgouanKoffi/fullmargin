const {
  Community,
  CommunityPost,
  uploadBuffer,
  compressImageBuffer,
} = require("./_shared");

module.exports = async function updatePostMedia(req, res) {
  try {
    const keepRaw = String(req.body.keep || "[]");
    let keep = [];
    try {
      keep = JSON.parse(keepRaw);
    } catch {
      keep = [];
    }
    keep = Array.isArray(keep) ? keep.filter((x) => typeof x === "string") : [];

    const post = await CommunityPost.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).lean();
    if (!post)
      return res.status(404).json({ ok: false, error: "Post introuvable" });

    const keptMedia = (post.media || []).filter((m) =>
      keep.includes(m.publicId)
    );

    const uploaded = [];
    for (let i = 0; i < (req.files || []).length; i++) {
      const f = req.files[i];
      const isVideo = f.mimetype.startsWith("video/");
      const publicId = `community_post/${req.params.id}_${Date.now()}_${i}`;

      let bufferToUpload = f.buffer;
      let resourceType = "image";

      if (isVideo) {
        resourceType = "video";
      } else {
        bufferToUpload = await compressImageBuffer(f.buffer);
      }

      const up = await uploadBuffer(bufferToUpload, {
        folder: "community_posts",
        publicId,
        resourceType,
        uploadOptions: isVideo
          ? { resource_type: "video", eager_async: true }
          : {},
      });

      uploaded.push({
        kind: isVideo ? "video" : "image",
        url: up.secure_url || up.url,
        publicId: up.public_id || publicId,
        width: up.width,
        height: up.height,
        duration: up.duration,
        thumbnail: isVideo ? up?.thumbnail_url || "" : "",
      });
    }

    const finalMedia = [...keptMedia, ...uploaded];

    const { content, scheduledAt, visibility } = req.body || {};
    const set = { media: finalMedia };

    // ✏️ contenu (optionnel)
    if (typeof content === "string") {
      set.content = String(content).trim().slice(0, 10000);
      set.isEdited = true;
      set.editedAt = new Date();
    }

    // 🔐 visibilité (optionnelle)
    if (visibility === "public" || visibility === "private") {
      set.visibility = visibility;
    }

    // ⏰ programmation (optionnelle, owner seulement)
    if (scheduledAt !== undefined) {
      const community = await Community.findOne({ _id: post.communityId })
        .select({ ownerId: 1 })
        .lean();
      const isOwner =
        community && String(community.ownerId) === String(req.auth.userId);
      if (!isOwner) {
        return res
          .status(403)
          .json({ ok: false, error: "Seul le propriétaire peut programmer" });
      }

      const raw = scheduledAt;
      if (raw === "" || raw === null) {
        set.isPublished = true;
        set.scheduledAt = null;
        set.publishedAt = new Date();
      } else {
        const dt = new Date(String(raw));
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

    await CommunityPost.updateOne({ _id: req.params.id }, { $set: set });
    const updated = await CommunityPost.findById(req.params.id).lean();

    return res.json({
      ok: true,
      data: { ...updated, id: String(updated._id) },
    });
  } catch (e) {
    console.error("[POSTS] media PUT ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Mise à jour des médias impossible" });
  }
};
