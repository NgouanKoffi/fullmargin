// backend/src/routes/communaute/courses/create.js
const {
  upload,
  slugify,
  assertCommunityOwner,
  normalizeModules,
  Course,
  uploadImageBuffer,
  uploadVideoBuffer,
  uploadPdfBuffer,
  getAuth,
} = require("./_shared");

const { createNotif } = require("../../../utils/notifications");
const CommunityMember = require("../../../models/communityMember.model");

module.exports = (router) => {
  router.post("/", upload.any(), async (req, res) => {
    try {
      // AUTH
      const auth = getAuth(req);
      if (!auth || !auth.userId) {
        return res.status(401).json({ ok: false, error: "Non autorisé" });
      }

      // PAYLOAD
      const raw = req.body?.payload || "{}";
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return res
          .status(400)
          .json({ ok: false, error: "payload_invalid_json" });
      }

      const {
        communityId,
        title = "",
        level = "Tous niveaux",
        learnings = [],
        shortDesc = "",
        longDesc = "",
        modules = [],
        priceType = "free",
        currency = "USD",
        price = undefined,

        visibility = "private", // 👈 nouveau
      } = body;

      // OWNER CHECK
      const check = await assertCommunityOwner(communityId, auth.userId);
      if (!check.ok) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      if (!title || title.trim().length < 3) {
        return res
          .status(400)
          .json({ ok: false, error: "title_required_min_3" });
      }

      if (priceType === "paid") {
        const p = Number(price);
        if (!Number.isFinite(p) || p < 1)
          return res.status(400).json({ ok: false, error: "price_min_1" });
        if (!currency || typeof currency !== "string")
          return res
            .status(400)
            .json({ ok: false, error: "currency_required_for_paid" });
      }

      // FILES MAP
      const filesMap = {};
      (req.files || []).forEach((f) => {
        filesMap[f.fieldname] = f;
      });

      // COVER UPLOAD
      let coverUrl = "";
      if (filesMap["cover"]) {
        const up = await uploadImageBuffer(filesMap["cover"].buffer, {
          folder: "courses/covers",
          publicId: `cover_${Date.now()}`,
        });
        coverUrl = up.secure_url || "";
      }

      // FILES IN MODULES
      const modulesCopy = Array.isArray(modules)
        ? JSON.parse(JSON.stringify(modules))
        : [];

      for (const m of modulesCopy) {
        for (const l of m.lessons || []) {
          for (const it of l.items || []) {
            if (it.url) continue;

            let f = it.fileKey ? filesMap[it.fileKey] : undefined;

            if (!f && it.id) {
              const guess = `files[f_${it.id}]`;
              if (filesMap[guess]) f = filesMap[guess];
            }
            if (!f) continue;

            const isVideo = it.type === "video" || it.subtype === "video";
            const isImage = it.type === "image" || it.subtype === "image";

            if (isVideo) {
              const up = await uploadVideoBuffer(f.buffer, {
                folder: "courses/videos",
                publicId: `vid_${Date.now()}`,
              });
              it.url = up.secure_url || "";
              it.publicId = up.public_id || "";
              const dur = Number(up.duration || 0);
              it.durationMin = dur
                ? Math.max(1, Math.round(dur / 60))
                : undefined;
            } else if (isImage) {
              const up = await uploadImageBuffer(f.buffer, {
                folder: "courses/images",
                publicId: `img_${Date.now()}`,
              });
              it.url = up.secure_url || "";
              it.publicId = up.public_id || "";
            } else {
              const up = await uploadPdfBuffer(f.buffer, {
                folder: "courses/pdfs",
                publicId: `pdf_${Date.now()}`,
              });
              it.url = up.secure_url || "";
              it.publicId = up.public_id || "";
            }

            delete it.fileKey;
          }
        }
      }

      const norm = normalizeModules(modulesCopy);

      // COURSE CREATION
      const doc = await Course.create({
        communityId,
        ownerId: auth.userId,
        title: title.trim(),
        slug: slugify(title),
        introduction: "",
        shortDesc: shortDesc.trim(),
        description: longDesc.trim(),
        coverUrl,
        modules: norm,
        level,
        learnings,
        priceType,
        currency,
        price: priceType === "paid" ? Number(price) : undefined,
        visibility: ["public", "private"].includes(visibility)
          ? visibility
          : "private",
        reviewsCount: 0,
        ratingAvg: null,
        isActive: true,
        deletedAt: null,
      });

      const saved = await Course.findById(doc._id).lean();

      // NOTIFICATIONS
      try {
        const members = await CommunityMember.find({
          communityId,
          status: "active",
        })
          .select("userId")
          .lean();

        for (const m of members) {
          const uid = String(m.userId || "");
          if (!uid || uid === String(auth.userId)) continue;

          await createNotif({
            userId: uid,
            kind: "course_created",
            communityId: String(communityId),
            payload: {
              courseId: String(doc._id),
              title: doc.title,
              priceType,
              currency,
              price: priceType === "paid" ? Number(price) : undefined,
            },
          });
        }
      } catch (e) {
        console.error("[COURSES] create notif failed:", e);
      }

      return res.status(201).json({
        ok: true,
        data: { ...saved, id: String(saved._id) },
      });
    } catch (e) {
      console.error("[COURSES] create ERROR:", e);

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

      return res.status(500).json({ ok: false, error: "Création impossible" });
    }
  });
};
