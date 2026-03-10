const {
  MAX_NAME,
  MAX_DESC,
  clampStr,
  requireAuth,
  upload,
  makeRid,
  Community,
  CommunityGroup,
  uploadImageBuffer,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

/**
 * POST /api/communaute/groups
 */
module.exports = (router) => {
  router.post("/", requireAuth, upload.single("cover"), async (req, res) => {
    const rid = makeRid(req);
    try {
      const userId = req.auth.userId;
      const communityId = clampStr(req.body.communityId, 60);

      if (!communityId) {
        return res
          .status(400)
          .json({ ok: false, error: "communityId invalide ou manquant" });
      }

      const community = await Community.findById(communityId).lean();
      if (!community) {
        return res
          .status(404)
          .json({ ok: false, error: "Communauté introuvable" });
      }

      let payload = {};
      try {
        payload =
          typeof req.body.payload === "string"
            ? JSON.parse(req.body.payload)
            : {};
      } catch {
        payload = {};
      }

      const rawName = clampStr(payload.name, MAX_NAME);
      const name = rawName || "Nouveau groupe";

      const rawDescription = clampStr(payload.description || "", MAX_DESC);

      const accessType = payload.accessType === "course" ? "course" : "free";
      const courseId =
        accessType === "course" && payload.courseId
          ? String(payload.courseId)
          : null;

      // 🔐 Visibilité (public | private) – défaut: public
      const visibility =
        payload.visibility === "private" ? "private" : "public";

      let coverUrl = null;
      if (req.file && req.file.buffer) {
        try {
          const uploaded = await uploadImageBuffer(req.file.buffer, {
            folder: "community-groups/covers",
          });
          if (typeof uploaded === "string") {
            coverUrl = uploaded;
          } else if (uploaded && typeof uploaded === "object") {
            coverUrl = uploaded.secure_url || uploaded.url || null;
          }
        } catch (e) {
          console.warn(
            `[GROUPS ${rid}] upload cover failed: ${e?.message || e}`
          );
        }
      }

      const group = await CommunityGroup.create({
        community: community._id,
        owner: userId,
        name,
        description: rawDescription,
        accessType,
        courseId: courseId || null,
        coverUrl: coverUrl || null,
        visibility,
      });

      // 🔔 NOTIFICATION : groupe créé
      await createNotif({
        userId,
        kind: "group_created",
        communityId: String(community._id),
        payload: {
          groupId: String(group._id),
          name: group.name,
          communityName: community.name,
          accessType: group.accessType,
        },
      });

      const out = {
        ok: true,
        data: {
          id: String(group._id),
          communityId: String(group.community),
          ownerId: String(group.owner),
          name: group.name,
          description: group.description || "",
          accessType: group.accessType,
          courseId: group.courseId || null,
          coverUrl: group.coverUrl || null,
          visibility: group.visibility === "private" ? "private" : "public",
          createdAt:
            group.createdAt?.toISOString?.() || new Date().toISOString(),
          updatedAt:
            group.updatedAt?.toISOString?.() || new Date().toISOString(),
          membersCount: 0,
        },
      };

      return res.status(201).json(out);
    } catch (e) {
      console.error(`[GROUPS ${rid}] POST /groups ERROR: ${e?.stack || e}`);
      return res.status(500).json({
        ok: false,
        error: "Création du groupe impossible",
      });
    }
  });
};
