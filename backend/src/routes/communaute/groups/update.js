const {
  MAX_NAME,
  MAX_DESC,
  clampStr,
  requireAuth,
  upload,
  makeRid,
  CommunityGroup,
  CommunityGroupMember,
  uploadImageBuffer,
} = require("./_shared");

/**
 * PATCH /api/communaute/groups/:id
 */
module.exports = (router) => {
  router.patch(
    "/:id",
    requireAuth,
    upload.single("cover"),
    async (req, res) => {
      const rid = makeRid(req);
      try {
        const userId = req.auth.userId;
        const groupId = clampStr(req.params.id, 80);

        const group = await CommunityGroup.findOne({
          _id: groupId,
          deletedAt: null,
        });
        if (!group) {
          return res
            .status(404)
            .json({ ok: false, error: "Groupe introuvable" });
        }

        if (String(group.owner) !== String(userId)) {
          return res.status(403).json({ ok: false, error: "Accès refusé" });
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

        if (payload.name !== undefined) {
          const rawName = clampStr(payload.name, MAX_NAME);
          group.name = rawName || group.name || "Groupe";
        }

        if (payload.description !== undefined) {
          const rawDescription = clampStr(payload.description, MAX_DESC);
          group.description = rawDescription;
        }

        if (payload.accessType !== undefined) {
          group.accessType =
            payload.accessType === "course" ? "course" : "free";
        }

        if (payload.courseId !== undefined) {
          group.courseId =
            group.accessType === "course" && payload.courseId
              ? payload.courseId
              : null;
        }

        // 🔐 Maj visibilité
        if (payload.visibility !== undefined) {
          group.visibility =
            payload.visibility === "private" ? "private" : "public";
        }

        if (req.file && req.file.buffer) {
          try {
            const uploaded = await uploadImageBuffer(req.file.buffer, {
              folder: "community-groups/covers",
            });
            let coverUrl = null;
            if (typeof uploaded === "string") {
              coverUrl = uploaded;
            } else if (uploaded && typeof uploaded === "object") {
              coverUrl = uploaded.secure_url || uploaded.url || null;
            }
            if (coverUrl) group.coverUrl = coverUrl;
          } catch (e) {
            console.warn(
              `[GROUPS ${rid}] upload cover (update) failed: ${e?.message || e}`
            );
          }
        }

        await group.save();

        const membersCount = await CommunityGroupMember.countDocuments({
          group: group._id,
          leftAt: null,
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
            createdAt: group.createdAt?.toISOString?.() || null,
            updatedAt:
              group.updatedAt?.toISOString?.() || new Date().toISOString(),
            membersCount,
          },
        };

        return res.status(200).json(out);
      } catch (e) {
        console.error(
          `[GROUPS ${rid}] PATCH /groups/:id ERROR: ${e?.stack || e}`
        );
        return res.status(500).json({
          ok: false,
          error: "Mise à jour du groupe impossible",
        });
      }
    }
  );
};
