const {
  upload,
  requireAuth,
  uploadImageBuffer,
  nameExistsCI,
  Community,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");

module.exports = (router) => {
  router.post(
    "/",
    requireAuth,
    upload.fields([
      { name: "cover", maxCount: 1 },
      { name: "logo", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const already = await Community.exists({
          ownerId: req.auth.userId,
          deletedAt: null,
        });
        if (already) {
          return res.status(409).json({
            ok: false,
            error: "Vous avez déjà une communauté",
            code: "ALREADY_HAS_COMMUNITY",
          });
        }

        const {
          name = "",
          slug = "",
          visibility = "public",
          category = "",
          categoryOther = "",
          description = "",
        } = req.body;

        if (!name || !slug || !category) {
          return res
            .status(400)
            .json({ ok: false, error: "Champs requis manquants" });
        }

        if (await nameExistsCI(name)) {
          return res
            .status(409)
            .json({ ok: false, error: "Nom déjà utilisé", code: "NAME_TAKEN" });
        }

        const doc = await Community.create({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          visibility: visibility === "private" ? "private" : "public",
          category: category.trim().toLowerCase(),
          categoryOther: (categoryOther || "").trim(),
          description: (description || "").trim(),
          ownerId: req.auth.userId,
          coverUrl: "",
          logoUrl: "",
          deletedAt: null,
        });

        const updates = {};

        const coverFile = req.files?.cover?.[0];
        if (coverFile?.buffer?.length) {
          const up = await uploadImageBuffer(coverFile.buffer, {
            folder: "communities",
            publicId: `${doc._id}_cover`,
          });
          updates.coverUrl = up.secure_url || up.url || "";
        }

        const logoFile = req.files?.logo?.[0];
        if (logoFile?.buffer?.length) {
          const up = await uploadImageBuffer(logoFile.buffer, {
            folder: "communities",
            publicId: `${doc._id}_logo`,
          });
          updates.logoUrl = up.secure_url || up.url || "";
        }

        if (Object.keys(updates).length) {
          await Community.updateOne({ _id: doc._id }, { $set: updates });
          Object.assign(doc, updates);
        }

        // 🔔 NOTIFICATION AUTOMATIQUE
        await createNotif({
          userId: req.auth.userId,
          kind: "community_created",
          communityId: String(doc._id),
          payload: {
            name: doc.name,
            slug: doc.slug,
          },
        });

        return res.status(201).json({ ok: true, data: doc.toJSON() });
      } catch (e) {
        if (e?.code === 11000 && e?.keyPattern?.slug) {
          return res.status(409).json({
            ok: false,
            error: "Slug déjà utilisé",
            code: "SLUG_TAKEN",
          });
        }
        console.error("[COMMUNITY CREATE]", e);
        return res
          .status(500)
          .json({ ok: false, error: "Création impossible" });
      }
    }
  );
};
