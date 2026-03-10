// backend/src/routes/public.podcasts.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

let Podcast;
try {
  Podcast = require("../models/podcast.model");
} catch {
  const mongoose2 = require("mongoose");
  const PodcastSchema = new mongoose2.Schema(
    {
      title: String,
      language: {
        type: String,
        enum: ["fr", "en"],
        default: "fr",
        index: true,
      },
      status: {
        type: String,
        enum: ["brouillon", "publie"],
        default: "brouillon",
        index: true,
      },
      category: String,
      author: String,
      html: String,
      coverUrl: String,
      audioUrl: String,
      duration: Number,
      publishedAt: Date,
      deletedAt: Date,
      likedBy: [String],
      dislikedBy: [String],
      savedBy: [String],
      viewedBy: [String],
      likesCount: Number,
      dislikesCount: Number,
      viewsCount: Number,
      savesCount: Number,
    },
    { timestamps: true }
  );
  Podcast =
    mongoose2.models.Podcast || mongoose2.model("Podcast", PodcastSchema);
}

/* --------- modèle playlist (par user OU par fp) --------- */
let PodcastPlaylist;
try {
  PodcastPlaylist = require("../models/podcast.playlist.model");
} catch {
  const PlaylistSchema = new mongoose.Schema(
    {
      // soit on a un userId, soit on a un visitorFp
      userId: { type: String, index: true },
      visitorFp: { type: String, index: true },
      podcastId: { type: mongoose.Schema.Types.ObjectId, ref: "Podcast" },
    },
    { timestamps: true }
  );
  PlaylistSchema.index(
    { userId: 1, podcastId: 1 },
    { unique: true, sparse: true }
  );
  PlaylistSchema.index(
    { visitorFp: 1, podcastId: 1 },
    { unique: true, sparse: true }
  );

  PodcastPlaylist =
    mongoose.models.PodcastPlaylist ||
    mongoose.model("PodcastPlaylist", PlaylistSchema);
}

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
const stripHtml = (html = "") =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// 🔽 helper pour alléger les covers Cloudinary déjà stockées
function toSmallCover(url = "") {
  if (!url) return "";
  // on vise le pattern cloudinary classique
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_600/");
  }
  // si ce n'est pas cloudinary, on renvoie tel quel
  return url;
}

function getFp(req) {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["cf-connecting-ip"] ||
    req.ip ||
    "0.0.0.0";
  const ua = String(req.headers["user-agent"] || "ua").slice(0, 80);
  return `${ip}|${ua}`.slice(0, 120);
}

// pour la playlist : on essaie d’abord l’utilisateur, sinon le fp
function getPlaylistOwner(req) {
  if (req.user && req.user.id) {
    return { userId: String(req.user.id), visitorFp: null };
  }
  const fp = getFp(req);
  return { userId: null, visitorFp: fp };
}

function count(v) {
  return Array.isArray(v) ? v.length : Number(v || 0);
}

function mapPublic(p, fp) {
  const likes = count(p.likedBy) || p.likesCount || 0;
  const dislikes = count(p.dislikedBy) || p.dislikesCount || 0;
  const views = count(p.viewedBy) || p.viewsCount || 0;
  const saves = count(p.savedBy) || p.savesCount || 0;

  const isNew =
    fp && Array.isArray(p.viewedBy) ? !p.viewedBy.includes(fp) : false;

  return {
    id: String(p._id),
    title: p.title || "Sans titre",
    artist: p.author || "Anonyme",
    cover: toSmallCover(p.coverUrl || ""),
    durationSec: p.duration != null ? Number(p.duration) : 0,
    description: stripHtml(p.html || ""),
    html: p.html || "",
    audioUrl: p.audioUrl || "",
    category: p.category || "Autre",
    language: p.language === "en" ? "en" : "fr",
    publishedAt: p.publishedAt ? toISO(p.publishedAt) : undefined,
    likesCount: likes,
    dislikesCount: dislikes,
    viewsCount: views,
    savesCount: saves,
    isNew,
  };
}

/* =========================================================
   ==============   PLAYLIST PERSISTANTE   =================
   ========================================================= */
router.get("/playlist", async (req, res) => {
  try {
    const owner = getPlaylistOwner(req);

    const query = owner.userId
      ? { userId: owner.userId }
      : { visitorFp: owner.visitorFp };

    const rows = await PodcastPlaylist.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const ids = rows.map((r) => String(r.podcastId));

    return res.status(200).json({ ok: true, data: { items: ids } });
  } catch (e) {
    console.error("[PUBLIC POD] PLAYLIST GET ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de charger la playlist" });
  }
});

router.post("/playlist", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const owner = getPlaylistOwner(req);

    const doc = { podcastId: id };
    if (owner.userId) doc.userId = owner.userId;
    else doc.visitorFp = owner.visitorFp;

    await PodcastPlaylist.updateOne(doc, doc, { upsert: true });

    return res.status(200).json({ ok: true, data: { added: true } });
  } catch (e) {
    console.error("[PUBLIC POD] PLAYLIST ADD ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'ajouter à la playlist" });
  }
});

router.delete("/playlist/:id", async (req, res) => {
  try {
    const podcastId = req.params.id;
    if (!podcastId || !mongoose.Types.ObjectId.isValid(podcastId)) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const owner = getPlaylistOwner(req);
    const query = owner.userId
      ? { userId: owner.userId, podcastId }
      : { visitorFp: owner.visitorFp, podcastId };

    await PodcastPlaylist.deleteOne(query);

    return res.status(200).json({ ok: true, data: { removed: true } });
  } catch (e) {
    console.error("[PUBLIC POD] PLAYLIST DELETE ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de retirer de la playlist" });
  }
});

/* ---------------- LIST (publique) ---------------- */
router.get("/", async (req, res) => {
  try {
    const fp = getFp(req);

    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();

    const filter = {
      status: "publie",
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };

    const q = clampStr(req.query.q, 200);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { title: re },
        { author: re },
        { html: re },
        { category: re },
      ];
    }

    const category = clampStr(req.query.category, 120);
    if (category) filter.category = category;

    const lang = String(req.query.language || "")
      .trim()
      .toLowerCase();
    if (lang === "fr" || lang === "en") filter.language = lang;

    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (from || to) {
      filter.publishedAt = {};
      if (from) filter.publishedAt.$gte = from;
      if (to) filter.publishedAt.$lte = to;
    }

    const rows = await Podcast.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      data: {
        items: rows.map((p) => mapPublic(p, fp)),
        nextCursor: null,
      },
    });
  } catch (e) {
    console.error("[PUBLIC POD] LIST ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------------- NEW COUNT (pour le badge) ---------------- */
router.get("/__meta/new-count", async (req, res) => {
  try {
    const fp = getFp(req);
    const category = clampStr(req.query.category, 120);
    const lang = String(req.query.language || "")
      .trim()
      .toLowerCase();

    const filter = {
      status: "publie",
      deletedAt: null,
      viewedBy: { $nin: [fp] },
    };

    if (category) filter.category = category;
    if (lang === "fr" || lang === "en") filter.language = lang;

    const countDocs = await Podcast.countDocuments(filter);

    return res.status(200).json({ ok: true, data: { count: countDocs } });
  } catch (e) {
    console.error("[PUBLIC POD] NEW COUNT ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de compter les nouveaux" });
  }
});

/* ---------------- NEW COUNTS PAR CATÉGORIE ---------------- */
router.get("/__meta/new-counts", async (req, res) => {
  try {
    const fp = getFp(req);
    const raw = String(req.query.categories || "").trim();
    const lang = String(req.query.language || "")
      .trim()
      .toLowerCase();

    const categories = raw
      ? raw
          .split(",")
          .map((s) => decodeURIComponent(s).trim())
          .filter(Boolean)
      : [];

    const result = {};

    if (categories.length === 0) {
      return res.status(200).json({ ok: true, data: { counts: result } });
    }

    for (const cat of categories) {
      const filter = {
        status: "publie",
        deletedAt: null,
        viewedBy: { $nin: [fp] },
        category: cat,
      };
      if (lang === "fr" || lang === "en") {
        filter.language = lang;
      }
      const total = await Podcast.countDocuments(filter);
      result[cat] = total;
    }

    return res.status(200).json({ ok: true, data: { counts: result } });
  } catch (e) {
    console.error(
      "[PUBLIC POD] NEW COUNTS BY CATEGORY ERROR:",
      e?.message || e
    );
    return res.status(500).json({
      ok: false,
      error: "Impossible de compter les nouveaux par catégorie",
    });
  }
});

/* ---------------- ONE (publique) ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const fp = getFp(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });
    }
    const p = await Podcast.findOne({
      _id: req.params.id,
      status: "publie",
      deletedAt: null,
    }).lean();
    if (!p)
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });
    return res
      .status(200)
      .json({ ok: true, data: { podcast: mapPublic(p, fp) } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------------- VIEW (unique / visiteur) ---------------- */
router.post("/:id/view", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });
    }
    const fp = getFp(req);

    await Podcast.updateOne(
      { _id: id, status: "publie", deletedAt: null },
      { $addToSet: { viewedBy: fp } }
    );

    const p = await Podcast.findById(id, "viewedBy").lean();
    const viewsCount = count(p?.viewedBy);
    await Podcast.updateOne({ _id: id }, { viewsCount });
    return res.status(200).json({ ok: true, data: { viewsCount } });
  } catch (e) {
    console.error("[PUBLIC POD] VIEW ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'enregistrer la vue" });
  }
});

/* ---------------- REACT ---------------- */
router.post("/:id/react", async (req, res) => {
  try {
    const id = req.params.id;
    const { type, action } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });
    }
    if (
      !["like", "dislike"].includes(type) ||
      !["set", "unset"].includes(action)
    ) {
      return res.status(400).json({ ok: false, error: "Payload invalide" });
    }
    const fp = getFp(req);

    if (action === "set") {
      if (type === "like") {
        await Podcast.updateOne(
          { _id: id, status: "publie", deletedAt: null },
          { $addToSet: { likedBy: fp }, $pull: { dislikedBy: fp } }
        );
      } else {
        await Podcast.updateOne(
          { _id: id, status: "publie", deletedAt: null },
          { $addToSet: { dislikedBy: fp }, $pull: { likedBy: fp } }
        );
      }
    } else {
      if (type === "like") {
        await Podcast.updateOne(
          { _id: id, status: "publie", deletedAt: null },
          { $pull: { likedBy: fp } }
        );
      } else {
        await Podcast.updateOne(
          { _id: id, status: "publie", deletedAt: null },
          { $pull: { dislikedBy: fp } }
        );
      }
    }

    const p = await Podcast.findById(id, "likedBy dislikedBy").lean();
    const likesCount = count(p?.likedBy);
    const dislikesCount = count(p?.dislikedBy);
    await Podcast.updateOne({ _id: id }, { likesCount, dislikesCount });

    return res
      .status(200)
      .json({ ok: true, data: { likesCount, dislikesCount } });
  } catch (e) {
    console.error("[PUBLIC POD] REACT ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'enregistrer la réaction" });
  }
});

/* ---------------- SAVE ---------------- */
router.post("/:id/save", async (req, res) => {
  try {
    const id = req.params.id;
    const { action } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ ok: false, error: "Podcast introuvable" });
    }
    if (!["set", "unset"].includes(action)) {
      return res.status(400).json({ ok: false, error: "Payload invalide" });
    }
    const fp = getFp(req);

    if (action === "set") {
      await Podcast.updateOne(
        { _id: id, status: "publie", deletedAt: null },
        { $addToSet: { savedBy: fp } }
      );
    } else {
      await Podcast.updateOne(
        { _id: id, status: "publie", deletedAt: null },
        { $pull: { savedBy: fp } }
      );
    }

    const p = await Podcast.findById(id, "savedBy").lean();
    const savesCount = count(p?.savedBy);
    await Podcast.updateOne({ _id: id }, { savesCount });

    return res.status(200).json({ ok: true, data: { savesCount } });
  } catch (e) {
    console.error("[PUBLIC POD] SAVE ERROR:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'enregistrer la playlist" });
  }
});

module.exports = router;
