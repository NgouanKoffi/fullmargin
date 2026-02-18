// routes/shares.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const NoteShare = require("../models/noteShare.model");
const ShareUnique = require("../models/shareUnique.model");
const { ok, fail } = require("./auth/_helpers");

/* ---------------- Utils ---------------- */
const clamp = (s, n) =>
  String(s ?? "")
    .trim()
    .slice(0, n);

function fpFromReq(req) {
  const ip = (req.headers["x-forwarded-for"] || req.ip || "")
    .toString()
    .split(",")[0]
    .trim();
  const ua = String(req.headers["user-agent"] || "");
  return crypto
    .createHash("sha256")
    .update(ip + "|" + ua)
    .digest("hex");
}

/* =========================================================
   POST /api/shares/put
   Body: { hash: string, title?: string, blob: string }
   -> { id }
   - Upsert sur le hash
   - Stocke le blob (lz-string encodé) pour pouvoir servir un lien court /n/:id

   ⚠️ Assure-toi d'avoir un index unique sur NoteShare.hash :
      db.noteshares.createIndex({ hash: 1 }, { unique: true });
   ========================================================= */
router.post("/put", async (req, res) => {
  try {
    const { hash, title, blob } = req.body || {};

    if (typeof hash !== "string" || !hash.trim()) {
      return fail(res, "hash manquant", 400);
    }
    if (typeof blob !== "string" || blob.length < 1) {
      return fail(res, "blob manquant", 400);
    }
    // limite raisonnable (≈200 Ko encodés)
    if (blob.length > 200_000) {
      return fail(res, "blob trop volumineux", 413);
    }

    const now = new Date();
    const doc = await NoteShare.findOneAndUpdate(
      { hash },
      {
        $set: {
          title: clamp(title, 160),
          blob: String(blob),
          lastViewedAt: now,
        },
        // 🔧 ajout de hash à l'insertion (manquait)
        $setOnInsert: { hash, uniqueViews: 0, createdAt: now },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return ok(res, { id: String(doc._id) });
  } catch (e) {
    console.error("[POST /shares/put]", e?.message || e);
    return fail(res, "Impossible d'enregistrer le partage", 500);
  }
});

/* =========================================================
   GET /api/shares/get/:id
   -> { blob, title, hash }
   ========================================================= */
router.get("/get/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return fail(res, "id manquant", 400);

    const doc = await NoteShare.findById(id).lean();
    if (!doc) return fail(res, "introuvable", 404);

    return ok(res, {
      blob: doc.blob || "",
      title: doc.title || "",
      hash: doc.hash || "",
    });
  } catch (e) {
    console.error("[GET /shares/get/:id]", e?.message || e);
    return fail(res, "Impossible de récupérer le partage", 500);
  }
});

/* =========================================================
   POST /api/shares/view
   Body: { hash: string, title?: string, viewer?: string }
   -> { id, hash, views, title }

   ⚠️ Assure-toi d'avoir un index unique sur ShareUnique(hash, viewer) :
      db.shareuniques.createIndex({ hash: 1, viewer: 1 }, { unique: true });
   ========================================================= */
router.post("/view", async (req, res) => {
  try {
    const { hash, title, viewer } = req.body || {};
    if (typeof hash !== "string" || !hash.trim())
      return fail(res, "hash manquant", 400);

    // upsert du doc principal (1 doc par hash)
    const share = await NoteShare.findOneAndUpdate(
      { hash },
      { $setOnInsert: { hash, title: clamp(title, 160) } },
      { upsert: true, new: true }
    );

    // viewerId côté client, sinon fallback ip+ua
    const viewerId =
      typeof viewer === "string" && viewer.trim()
        ? viewer.trim()
        : fpFromReq(req);

    // essaie d'enregistrer un “unique viewer”
    let incremented = false;
    try {
      await ShareUnique.create({ hash, viewer: viewerId });
      await NoteShare.updateOne(
        { _id: share._id },
        { $inc: { uniqueViews: 1 }, $set: { lastViewedAt: new Date() } }
      ).exec();
      incremented = true;
    } catch (e) {
      // doublon => code Mongo 11000
      if (!(e && e.code === 11000)) {
        console.error("[shares.view] unique create:", e?.message || e);
      }
    }

    const fresh = incremented
      ? await NoteShare.findById(share._id).lean()
      : share.toObject();

    return ok(res, {
      id: String(fresh._id),
      hash: fresh.hash,
      views:
        typeof fresh.uniqueViews === "number"
          ? fresh.uniqueViews
          : fresh.views || 0,
      title: fresh.title,
    });
  } catch (e) {
    console.error("[POST /shares/view]", e?.message || e);
    return fail(res, "Impossible d'enregistrer la vue", 500);
  }
});

module.exports = router;
