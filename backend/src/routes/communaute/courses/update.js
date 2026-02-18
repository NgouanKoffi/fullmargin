// backend/src/routes/communaute/courses/update.js
const {
  upload,
  slugify,
  getAuth,
  assertCommunityOwner,
  normalizeModules,
  Course,
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
} = require("./_shared");

module.exports = (router) => {
  router.put("/:id", upload.any(), async (req, res) => {
    try {
      // AUTH
      const auth = getAuth(req);
      if (!auth || !auth.userId)
        return res.status(401).json({ ok: false, error: "Non autorisé" });

      // PARSE PAYLOAD
      let body = {};
      if (typeof req.body?.payload === "string") {
        try {
          body = JSON.parse(req.body.payload);
        } catch {
          return res
            .status(400)
            .json({ ok: false, error: "payload_invalid_json" });
        }
      }

      // FIND COURSE
      const course = await Course.findOne({
        _id: req.params.id,
        deletedAt: null,
      }).lean();
      if (!course)
        return res.status(404).json({ ok: false, error: "Introuvable" });

      // OWNER CHECK
      const check = await assertCommunityOwner(course.communityId, auth.userId);
      if (!check.ok)
        return res.status(403).json({ ok: false, error: check.error });

      const filesMap = {};
      (req.files || []).forEach((f) => (filesMap[f.fieldname] = f));

      const set = {};
      const {
        title,
        level,
        learnings,
        shortDesc,
        longDesc,
        modules,
        priceType,
        currency,
        price,
        isActive,
        visibility, // 👈 nouveau
      } = body;

      // BASIC FIELDS
      if (typeof title === "string" && title.trim()) {
        set.title = title.trim();
        set.slug = slugify(title.trim());
        set.titleLower = set.title.toLowerCase();
      }
      if (typeof level === "string") set.level = level;
      if (Array.isArray(learnings)) set.learnings = learnings;
      if (typeof shortDesc === "string") set.shortDesc = shortDesc.trim();
      if (typeof longDesc === "string") set.description = longDesc.trim();
      if (typeof isActive === "boolean") set.isActive = isActive;

      // VISIBILITY
      if (visibility === "public" || visibility === "private") {
        set.visibility = visibility;
      }

      // COVER
      if (filesMap["cover"]) {
        const up = await uploadImageBuffer(filesMap["cover"].buffer, {
          folder: "courses/covers",
          publicId: `cover_${Date.now()}`,
        });
        set.coverUrl = up.secure_url || "";
      }

      // MODULES + FILES
      if (Array.isArray(modules)) {
        const norm = normalizeModules(modules);

        for (const m of norm) {
          for (const l of m.lessons || []) {
            for (const it of l.items || []) {
              if (it.fileKey) {
                const f = filesMap[it.fileKey];
                if (!f) {
                  delete it.fileKey;
                  continue;
                }

                if (it.type === "video") {
                  const up = await uploadVideoBuffer(f.buffer, {
                    folder: "courses/videos",
                    publicId: `vid_${Date.now()}`,
                  });
                  it.url = up.secure_url || "";
                  it.publicId = up.public_id || "";
                  const d = Number(up.duration || 0);
                  it.durationMin = d ? Math.round(d / 60) : undefined;
                } else {
                  const up = await uploadPdfBuffer(f.buffer, {
                    folder: "courses/pdfs",
                    publicId: `pdf_${Date.now()}`,
                  });
                  it.url = up.secure_url || "";
                  it.publicId = up.public_id || "";
                }

                delete it.fileKey;
                continue;
              }

              if (it.url) {
                delete it.fileKey;
                continue;
              }

              delete it.fileKey;
            }
          }
        }

        set.modules = norm;
      }

      // PRICE
      if (typeof priceType === "string") {
        set.priceType = priceType;

        if (priceType === "paid") {
          const p = Number(price);
          if (!Number.isFinite(p) || p < 0.05)
            return res.status(400).json({ ok: false, error: "price_min_20" });

          if (!currency || typeof currency !== "string") {
            return res.status(400).json({
              ok: false,
              error: "currency_required_for_paid",
            });
          }

          set.currency = currency;
          set.price = p;
        } else {
          set.currency = currency || course.currency || "USD";
          set.price = undefined;
        }
      }

      // UPDATE
      if (!Object.keys(set).length) {
        const unchanged = await Course.findById(req.params.id).lean();
        return res.json({
          ok: true,
          data: { ...unchanged, id: String(unchanged._id) },
        });
      }

      await Course.updateOne({ _id: req.params.id }, { $set: set });

      const updated = await Course.findById(req.params.id).lean();
      return res.json({
        ok: true,
        data: { ...updated, id: String(updated._id) },
      });
    } catch (e) {
      console.error("[COURSES] update ERROR:", e);

      if (e?.code === 11000) {
        const key = e?.keyPattern?.slug
          ? "SLUG_TAKEN"
          : e?.keyPattern?.titleLower
          ? "TITLE_TAKEN"
          : "DUP_KEY";
        return res.status(409).json({
          ok: false,
          error: "Conflit d'unicité",
          code: key,
        });
      }

      return res
        .status(500)
        .json({ ok: false, error: "Mise à jour impossible" });
    }
  });
};
