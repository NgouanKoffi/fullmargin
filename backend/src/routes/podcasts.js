// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\podcasts.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});
const { uploadImageBuffer, uploadAudioBuffer } = require("../utils/storage");
const { verifyAuthHeader } = require("./auth/_helpers");

/* ---------------- Helpers ---------------- */
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const toISO = (d) => {
  try {
    return new Date(d).toISOString();
  } catch {
    return "";
  }
};

// data:URL (image/audio) -> Buffer
function parseDataURL(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const mime = m[1];
    const base64 = m[2];
    const buffer = Buffer.from(base64, "base64");
    return { mime, buffer };
  } catch {
    return null;
  }
}

function isAdmin(roles) {
  return Array.isArray(roles) && roles.includes("admin");
}

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = {
      userId: a.userId,
      roles: Array.isArray(a.roles) ? a.roles : [],
    };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ---------------- Modèle ---------------- */
let Podcast;
try {
  Podcast = require("../models/podcast.model");
} catch {
  const mongoose = require("mongoose");
  const PodcastSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

      title: { type: String, required: true },
      author: { type: String, default: "" },
      category: { type: String, required: true },
      html: { type: String, default: "" },

      coverUrl: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
      duration: { type: Number, default: null },

      language: {
        type: String,
        enum: ["fr", "en"],
        default: "fr",
        index: true,
      }, // 🆕
      status: {
        type: String,
        enum: ["brouillon", "publie"],
        default: "brouillon",
        index: true,
      },
      publishedAt: { type: Date, default: null },

      // AUDIT
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },

      deletedAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
  );
  Podcast = mongoose.models.Podcast || mongoose.model("Podcast", PodcastSchema);
}

function mapOut(p) {
  const cb =
    p.createdBy && typeof p.createdBy === "object" ? p.createdBy : null;
  const ub =
    p.updatedBy && typeof p.updatedBy === "object" ? p.updatedBy : null;

  return {
    id: String(p._id),
    title: p.title || "Sans titre",
    author: p.author || "",
    category: p.category || "Autre",
    html: p.html || "",
    coverUrl: p.coverUrl || "",
    audioUrl: p.audioUrl || "",
    duration: p.duration == null ? undefined : Number(p.duration),
    language: p.language === "en" ? "en" : "fr", // 🆕
    status: p.status || "brouillon",
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
    publishedAt: p.publishedAt ? toISO(p.publishedAt) : undefined,

    userId: p.user ? String(p.user) : undefined,

    createdById: p.createdBy ? String(cb?._id ?? p.createdBy) : undefined,
    createdByName: cb?.fullName || undefined,
    createdByEmail: cb?.email || undefined,

    updatedById: p.updatedBy ? String(ub?._id ?? p.updatedBy) : undefined,
    updatedByName: ub?.fullName || undefined,
    updatedByEmail: ub?.email || undefined,

    deletedBy: p.deletedBy ? String(p.deletedBy) : undefined,
    deletedAt: p.deletedAt ? toISO(p.deletedAt) : undefined,
  };
}

/* ---------------- LIST ---------------- */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId, roles } = req.auth;
    const admin = isAdmin(roles);

    // plus de limite ici
    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();

    // on garde tes filtres
    const filter = { deletedAt: null, updatedAt: { $lt: cursor } };

    // si pas admin → il ne voit que ce qu'il a créé
    if (!admin) {
      filter.user = userId;
    } else if (req.query.userId) {
      filter.user = req.query.userId;
    }

    // recherche texte
    const q = clampStr(req.query.q, 200);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: re }, { author: re }, { html: re }];
    }

    // statut
    const status = String(req.query.status || "").trim();
    if (status === "publie" || status === "brouillon") {
      filter.status = status;
    }

    // catégorie
    const category = clampStr(req.query.category, 120);
    if (category) {
      filter.category = category;
    }

    // langue
    const language = String(req.query.language || "").trim();
    if (language === "fr" || language === "en") {
      filter.language = language;
    }

    // période
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    // 👉 ICI : plus de .limit()
    const rows = await Podcast.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .populate([
        { path: "createdBy", select: "fullName email" },
        { path: "updatedBy", select: "fullName email" },
      ])
      .lean();

    // on renvoie tout, pas de découpage
    return res.status(200).json({
      ok: true,
      data: {
        items: rows.map(mapOut),
        nextCursor: null,
      },
    });
  } catch (e) {
    console.error("[POD] LIST ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------------- ONE ---------------- */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { userId, roles } = req.auth;
    const admin = isAdmin(roles);

    const filter = { _id: req.params.id, deletedAt: null };
    if (!admin) filter.user = userId;

    const p = await Podcast.findOne(filter).populate([
      { path: "createdBy", select: "fullName email" },
      { path: "updatedBy", select: "fullName email" },
    ]);

    if (!p)
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });

    return res.status(200).json({
      ok: true,
      data: { podcast: mapOut(p.toObject ? p.toObject() : p) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------------- CREATE ---------------- */
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId } = req.auth;
      const b = req.body || {};
      const title = clampStr(b.title || "Sans titre", 200);
      const category = clampStr(b.category || "Autre", 120);
      const author = clampStr(b.author || "", 160);
      const html = clampStr(b.html || "", 200000);
      const duration = b.duration != null ? Number(b.duration) : null;
      const language = String(b.language) === "en" ? "en" : "fr"; // 🆕

      const p = await Podcast.create({
        user: userId,
        title,
        category,
        author,
        html,
        duration,
        language, // 🆕
        status: "brouillon",
        createdBy: userId,
        updatedBy: userId,
      });

      // Cover
      let coverBuffer =
        (req.files?.cover && req.files.cover[0]?.buffer) || null;
      if (!coverBuffer && b.coverDataURL) {
        const parsed = parseDataURL(b.coverDataURL);
        coverBuffer = parsed?.buffer || null;
      }
      if (coverBuffer) {
        const up = await uploadImageBuffer(coverBuffer, {
          folder: "podcasts/covers",
          publicId: `u_${userId}_${p._id}`,
        });
        p.coverUrl = up.secure_url || up.url || p.coverUrl;
      }

      // Audio
      let audioBuffer =
        (req.files?.audio && req.files.audio[0]?.buffer) || null;
      if (!audioBuffer && b.audioDataURL) {
        const parsedA = parseDataURL(b.audioDataURL);
        audioBuffer = parsedA?.buffer || null;
      }
      if (audioBuffer) {
        const upA = await uploadAudioBuffer(audioBuffer, {
          folder: "podcasts/audio",
          publicId: `u_${userId}_${p._id}`,
        });
        p.audioUrl = upA.secure_url || upA.url || p.audioUrl;
      }

      await p.save();
      return res.status(201).json({
        ok: true,
        data: { id: String(p._id), updatedAt: toISO(p.updatedAt) },
      });
    } catch (e) {
      console.error("[POD] CREATE ERROR:", e?.stack || e);
      return res.status(500).json({ ok: false, error: "Création impossible" });
    }
  }
);

/* ---------------- UPDATE ---------------- */
router.patch(
  "/:id",
  requireAuth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId, roles } = req.auth;
      const admin = isAdmin(roles);

      const filter = { _id: req.params.id, deletedAt: null };
      if (!admin) filter.user = userId;

      const p = await Podcast.findOne(filter);
      if (!p)
        return res
          .status(404)
          .json({ ok: false, error: "Podcast introuvable" });

      const b = req.body || {};
      if (b.title !== undefined)
        p.title = clampStr(b.title, 200) || "Sans titre";
      if (b.category !== undefined)
        p.category = clampStr(b.category, 120) || "Autre";
      if (b.author !== undefined) p.author = clampStr(b.author, 160);
      if (b.html !== undefined) p.html = clampStr(b.html, 200000);
      if (b.duration !== undefined)
        p.duration = b.duration == null ? null : Number(b.duration);
      if (b.language !== undefined)
        p.language = String(b.language) === "en" ? "en" : "fr"; // 🆕

      // Cover
      let coverBuffer =
        (req.files?.cover && req.files.cover[0]?.buffer) || null;
      if (!coverBuffer && b.coverDataURL) {
        const parsed = parseDataURL(b.coverDataURL);
        coverBuffer = parsed?.buffer || null;
      }
      if (coverBuffer) {
        const up = await uploadImageBuffer(coverBuffer, {
          folder: "podcasts/covers",
          publicId: `u_${p.user}_${p._id}`,
        });
        p.coverUrl = up.secure_url || up.url || p.coverUrl;
      }

      // Audio
      let audioBuffer =
        (req.files?.audio && req.files.audio[0]?.buffer) || null;
      if (!audioBuffer && b.audioDataURL) {
        const parsedA = parseDataURL(b.audioDataURL);
        audioBuffer = parsedA?.buffer || null;
      }
      if (audioBuffer) {
        const upA = await uploadAudioBuffer(audioBuffer, {
          folder: "podcasts/audio",
          publicId: `u_${p.user}_${p._id}`,
        });
        p.audioUrl = upA.secure_url || upA.url || p.audioUrl;
      }

      p.updatedBy = userId;

      await p.save();
      return res
        .status(200)
        .json({ ok: true, data: { updatedAt: toISO(p.updatedAt) } });
    } catch (e) {
      console.error("[POD] UPDATE ERROR:", e?.stack || e);
      return res
        .status(500)
        .json({ ok: false, error: "Sauvegarde impossible" });
    }
  }
);

/* ---------------- TOGGLE publish/draft ---------------- */
router.post("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const { userId, roles } = req.auth;
    const admin = isAdmin(roles);

    const filter = { _id: req.params.id, deletedAt: null };
    if (!admin) filter.user = userId;

    const p = await Podcast.findOne(filter);
    if (!p)
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });

    p.status = p.status === "publie" ? "brouillon" : "publie";
    p.publishedAt = p.status === "publie" ? new Date() : null;
    p.updatedBy = userId;

    await p.save();
    return res.status(200).json({
      ok: true,
      data: {
        updatedAt: toISO(p.updatedAt),
        status: p.status,
        publishedAt: p.publishedAt ? toISO(p.publishedAt) : null,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Opération impossible" });
  }
});

/* ---------------- DELETE (soft) ---------------- */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { userId, roles } = req.auth;
    const admin = isAdmin(roles);

    const filter = { _id: req.params.id, deletedAt: null };
    if (!admin) filter.user = userId;

    const p = await Podcast.findOne(filter);
    if (!p)
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });

    p.deletedAt = new Date();
    p.deletedBy = userId;

    await p.save();
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

module.exports = router;
