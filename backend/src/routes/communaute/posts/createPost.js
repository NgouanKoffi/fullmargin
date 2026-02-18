// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\communaute\posts\createPost.js
const {
  Community,
  CommunityPost,
  CommunityMember,
  User,
  uploadBuffer,
  compressImageBuffer,
  createNotif,
} = require("./_shared");

module.exports = async function createPost(req, res) {
  try {
    const communityId = (req.body?.communityId || req.query?.communityId || "")
      .toString()
      .trim();
    const content = (req.body?.content || "").toString();
    const scheduledAt = req.body?.scheduledAt;

    // 🔐 visibilité envoyée par le front (private | public)
    const rawVisibility = (req.body?.visibility || "").toString().trim();
    const visibility = rawVisibility === "public" ? "public" : "private";

    const files = Array.isArray(req.files) ? req.files : [];

    // ✅ validation basique
    if (!communityId || (content.trim() === "" && files.length === 0)) {
      return res.status(400).json({
        ok: false,
        error: "Paramètres manquants",
        details: {
          communityId: !!communityId,
          hasContent: content.trim().length > 0,
          filesCount: files.length,
        },
      });
    }

    // ✅ communauté
    const community = await Community.findOne({
      _id: communityId,
      deletedAt: null,
    })
      .select({ _id: 1, ownerId: 1, allowSubscribersPosts: 1, name: 1 })
      .lean();

    if (!community) {
      return res
        .status(404)
        .json({ ok: false, error: "Communauté introuvable" });
    }

    const userId = String(req.auth.userId);
    const isOwner = String(community.ownerId) === userId;

    /* ------------ Programmation éventuelle ------------ */
    let scheduleDate = null;
    if (
      scheduledAt !== undefined &&
      scheduledAt !== null &&
      scheduledAt !== ""
    ) {
      const dt = new Date(String(scheduledAt));

      if (isNaN(dt.getTime()) || dt.getTime() < Date.now() + 60 * 1000) {
        return res
          .status(400)
          .json({ ok: false, error: "Date de programmation invalide" });
      }

      if (!isOwner) {
        return res
          .status(403)
          .json({ ok: false, error: "Seul le propriétaire peut programmer" });
      }

      scheduleDate = dt;
    }

    /* ------------ Droit de publier ------------ */
    if (!community.allowSubscribersPosts && !isOwner) {
      return res
        .status(403)
        .json({ ok: false, error: "Publications non autorisées" });
    }

    /* ------------ Création du post ------------ */
    const doc = await CommunityPost.create({
      communityId,
      authorId: userId,
      content: content.trim(),
      media: [],
      visibility, // 🔐 stocké en base
      isPublished: scheduleDate ? false : true,
      publishedAt: scheduleDate ? null : new Date(),
      scheduledAt: scheduleDate || null,
    });

    /* ------------ Upload des médias ------------ */
    const media = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f?.buffer) continue;

      const isVideo = f.mimetype?.startsWith("video/");
      const publicId = `community_post/${doc._id}_${Date.now()}_${i}`;

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

      media.push({
        kind: isVideo ? "video" : "image",
        url: up.secure_url || up.url,
        publicId: up.public_id || publicId,
        width: up.width,
        height: up.height,
        duration: up.duration,
        thumbnail: isVideo ? up?.thumbnail_url || "" : "",
      });
    }

    if (media.length) {
      await CommunityPost.updateOne({ _id: doc._id }, { $set: { media } });
      doc.media = media;
    }

    // incrément compteur de posts sur la communauté
    await Community.updateOne(
      { _id: communityId },
      { $inc: { postsCount: 1 } }
    );

    /* ------------ Auteur (pour payload) ------------ */
    const me = await User.findOne({ _id: userId })
      .select({ _id: 1, fullName: 1, avatarUrl: 1 })
      .lean();

    const authorPayload = {
      id: me ? String(me._id) : userId,
      name: me?.fullName || "",
      fullName: me?.fullName || "",
      avatarUrl: me?.avatarUrl || "",
    };

    /* ------------ Notifications ------------ */
    console.log("[DEBUG] createPost - Start Notifications. isOwner:", isOwner, "doc.isPublished:", doc.isPublished);

    // 1️⃣ Un abonné poste → notif TOUS les membres + owner
    if (!isOwner) {
      console.log("[DEBUG] Subscriber posting. Fetching all members...");
      // On récupère tous les membres (actifs ou sans statut)
      const allMembers = await CommunityMember.find({
        communityId: community._id,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ userId: 1 })
        .lean();
      
      console.log("[DEBUG] Found members count:", allMembers.length);

      // On construit une liste de gens à notifier
      const targetIds = new Set(allMembers.map((m) => String(m.userId)));
      if (community.ownerId) targetIds.add(String(community.ownerId));

      // On retire l'auteur du post (moi)
      targetIds.delete(userId);

      const toNotify = Array.from(targetIds);
      console.log("[DEBUG] Subscriber post - Notifying IDs:", toNotify);

      await Promise.all(
        toNotify.map((uid) =>
          createNotif({
            userId: uid,
            kind: "community_post_created",
            communityId: community._id,
            payload: {
              fromUserId: userId,
              fromUserName: me?.fullName || "",
              postId: String(doc._id),
              communityName: community.name || "",
            },
          })
        )
      );
    }

    // 2️⃣ Le owner poste (non programmé) → notif aux membres
    if (isOwner && doc.isPublished) {
      console.log("[DEBUG] Owner posting. Fetching members...");
      const members = await CommunityMember.find({
        communityId: community._id,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      })
        .select({ userId: 1 })
        .lean();

      console.log("[DEBUG] Owner post - Found members count:", members.length);

      const toNotify = members
        .map((m) => String(m.userId))
        .filter((uid) => uid !== String(community.ownerId));
      
      console.log("[DEBUG] Owner post - Notifying IDs:", toNotify);

      await Promise.all(
        toNotify.map((uid) =>
          createNotif({
            userId: uid,
            kind: "community_post_created_admin",
            communityId: community._id,
            payload: {
              postId: String(doc._id),
              communityName: community.name || "",
              fromUserId: String(community.ownerId),
              fromUserName: me?.fullName || "",
            },
          })
        )
      );
    }

    /* ------------ Réponse API ------------ */
    return res.status(201).json({
      ok: true,
      data: {
        id: String(doc._id),
        communityId: String(doc.communityId),
        author: authorPayload,
        authorName: authorPayload.fullName,
        authorFullName: authorPayload.fullName,
        authorAvatarUrl: authorPayload.avatarUrl,
        content: doc.content,
        media: doc.media,
        visibility: doc.visibility || "private", // 🔐 renvoyée au front
        likes: 0,
        likedByMe: false,
        comments: 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        isPublished: doc.isPublished,
        publishedAt: doc.publishedAt,
        scheduledAt: doc.scheduledAt,
      },
    });
  } catch (e) {
    console.error("[POSTS] create ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
};
