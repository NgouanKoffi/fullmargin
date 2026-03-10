const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const { verifyAuthHeader } = require("./auth/_helpers");
const Folder = require("../models/folder.model");
const NoteFolder = require("../models/noteFolder.model");
const Note = require("../models/note.model");

/* --- small utils --- */
const safe = (v) => {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
};
const short = (v) => (safe(v) || "").slice(0, 600);
const toISO = (d) => (d instanceof Date ? d : new Date(d)).toISOString();

/* req id + timing */
router.use((req, _res, next) => {
  req._rid =
    req._rid ||
    (typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));
  req._t0 = Date.now();
  next();
});

/* no-cache */
router.use((_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

/* auth */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ============= LIST ============= */
router.get("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const rows = await Folder.find({ user: req.auth.userId, deletedAt: null })
      .sort({ updatedAt: -1 })
      .lean();
    return res.status(200).json({
      ok: true,
      data: {
        items: rows.map((f) => ({
          id: String(f._id),
          name: f.name,
          parentId: f.parentId ? String(f.parentId) : null,
          createdAt: toISO(f.createdAt),
          updatedAt: toISO(f.updatedAt),
        })),
      },
    });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] LIST ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ============= CREATE ============= */
router.post("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const name = String(
      (req.body?.name || "").trim() || "Nouveau dossier"
    ).slice(0, 160);
    const parentId = req.body?.parentId || null;

    // parent doit appartenir au user si présent
    if (parentId) {
      const parent = await Folder.findOne({
        _id: parentId,
        user: req.auth.userId,
        deletedAt: null,
      }).lean();
      if (!parent)
        return res.status(400).json({ ok: false, error: "Parent invalide" });
    }

    const f = await Folder.create({
      user: req.auth.userId,
      name,
      parentId: parentId || null,
    });
    return res.status(201).json({
      ok: true,
      data: {
        folder: {
          id: String(f._id),
          name: f.name,
          parentId: f.parentId ? String(f.parentId) : null,
          createdAt: toISO(f.createdAt),
          updatedAt: toISO(f.updatedAt),
        },
      },
    });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] CREATE ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ============= UPDATE (rename/move) ============= */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const f = await Folder.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!f)
      return res.status(404).json({ ok: false, error: "Dossier introuvable" });

    if (req.body?.name !== undefined) {
      f.name = String((req.body.name || "").trim() || "Dossier").slice(0, 160);
    }
    if (req.body?.parentId !== undefined) {
      const parentId = req.body.parentId || null;
      if (parentId) {
        const parent = await Folder.findOne({
          _id: parentId,
          user: req.auth.userId,
          deletedAt: null,
        }).lean();
        if (!parent)
          return res.status(400).json({ ok: false, error: "Parent invalide" });
      }
      f.parentId = parentId;
    }

    await f.save();
    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(f.updatedAt) } });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] PATCH ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ============= DELETE (soft, + clear mappings) ============= */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const root = await Folder.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!root)
      return res.status(404).json({ ok: false, error: "Dossier introuvable" });

    // collecter tous les descendants
    const all = await Folder.find({ user: req.auth.userId, deletedAt: null })
      .select("_id parentId")
      .lean();
    const idSet = new Set([String(root._id)]);
    const childMap = new Map();
    for (const f of all) {
      const key = String(f.parentId || "null");
      const arr = childMap.get(key) || [];
      arr.push(String(f._id));
      childMap.set(key, arr);
    }
    const stack = [String(root._id)];
    while (stack.length) {
      const cur = stack.pop();
      const kids = childMap.get(cur) || [];
      for (const k of kids)
        if (!idSet.has(k)) {
          idSet.add(k);
          stack.push(k);
        }
    }
    const ids = Array.from(idSet);

    // soft-delete dossiers
    await Folder.updateMany(
      { _id: { $in: ids } },
      { $set: { deletedAt: new Date() } }
    );

    // remettre les notes à la racine
    await NoteFolder.updateMany(
      { user: req.auth.userId, folder: { $in: ids } },
      { $set: { folder: null } }
    );

    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] DELETE ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ============= MAP (note -> folder) ============= */

// Tout le mapping
router.get("/map", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const rows = await NoteFolder.find({ user: req.auth.userId }).lean();
    const map = {};
    for (const r of rows)
      map[String(r.note)] = r.folder ? String(r.folder) : null;
    return res.status(200).json({ ok: true, data: { map } });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] MAP GET ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

// Définir le dossier d'une note
router.patch("/map/:noteId", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!note)
      return res.status(404).json({ ok: false, error: "Note introuvable" });

    const folderId = req.body?.folderId || null;
    if (folderId) {
      const f = await Folder.findOne({
        _id: folderId,
        user: req.auth.userId,
        deletedAt: null,
      }).lean();
      if (!f)
        return res.status(400).json({ ok: false, error: "Dossier invalide" });
    }

    await NoteFolder.updateOne(
      { user: req.auth.userId, note: req.params.noteId },
      { $set: { folder: folderId } },
      { upsert: true }
    );

    return res.status(200).json({ ok: true, data: { updated: true } });
  } catch (e) {
    console.error(`[FOLDERS ${rid}] MAP SET ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

module.exports = router;
