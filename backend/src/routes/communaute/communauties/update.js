const {
  upload,
  requireAuth,
  uploadImageBuffer,
  nameExistsCI,
  Community,
} = require("./_shared");

async function ensureOwner(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Community.findOne({ _id: id, deletedAt: null }).lean();
    if (!doc) return res.status(404).json({ ok: false, error: "Introuvable" });
    if (String(doc.ownerId) !== String(req.auth.userId))
      return res.status(403).json({ ok: false, error: "Interdit" });
    req.community = doc;
    next();
  } catch {
    return res.status(400).json({ ok: false, error: "Requête invalide" });
  }
}

module.exports = (router) => {
  router.put(
    "/:id",
    requireAuth,
    ensureOwner,
    upload.fields([
      { name: "cover", maxCount: 1 },
      { name: "logo", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { name, slug, visibility, category, categoryOther, description } =
          req.body;

        const set = {};
        if (name) set.name = name.trim();
        if (slug) set.slug = slug.trim().toLowerCase();
        if (visibility) set.visibility = visibility;
        if (category) set.category = category.trim().toLowerCase();
        if (categoryOther) set.categoryOther = categoryOther.trim();
        if (description) set.description = description.trim();

        // cover
        const coverFile = req.files?.cover?.[0];
        if (coverFile?.buffer?.length) {
          const up = await uploadImageBuffer(coverFile.buffer, {
            folder: "communities",
            publicId: `${req.params.id}_cover`,
          });
          set.coverUrl = up.secure_url || up.url || "";
        }

        // logo
        const logoFile = req.files?.logo?.[0];
        if (logoFile?.buffer?.length) {
          const up = await uploadImageBuffer(logoFile.buffer, {
            folder: "communities",
            publicId: `${req.params.id}_logo`,
          });
          set.logoUrl = up.secure_url || up.url || "";
        }

        if (!Object.keys(set).length)
          return res.json({ ok: true, data: req.community });

        // check name uniqueness
        if (set.name && set.name !== req.community.name) {
          const taken = await nameExistsCI(set.name, req.params.id);
          if (taken)
            return res.status(409).json({
              ok: false,
              error: "Nom déjà utilisé",
              code: "NAME_TAKEN",
            });
        }

        // slug conflict
        if (set.slug && set.slug !== req.community.slug) {
          const conflict = await Community.exists({
            _id: { $ne: req.params.id },
            slug: set.slug,
            deletedAt: null,
          });
          if (conflict)
            return res.status(409).json({
              ok: false,
              error: "Slug déjà utilisé",
              code: "SLUG_TAKEN",
            });
        }

        await Community.updateOne({ _id: req.params.id }, { $set: set });
        const updated = await Community.findById(req.params.id).lean();

        return res.json({
          ok: true,
          data: { ...updated, id: String(updated._id) },
        });
      } catch (e) {
        console.error("[COMMUNITY UPDATE]", e);
        return res
          .status(500)
          .json({ ok: false, error: "Mise à jour impossible" });
      }
    }
  );
};
