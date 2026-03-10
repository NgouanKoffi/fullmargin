const express = require("express");
const router = express.Router();
const Project = require("../models/kanban.project.model");
const Task = require("../models/kanban.task.model");
const { verifyAuthHeader } = require("./auth/_helpers");
const { uploadImageBuffer } = require("../utils/storage"); // storage (Cloudinary ou Bunny)

/* ===== utils ===== */
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const toISO = (d) => {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return x.toISOString();
  } catch {
    return "";
  }
};
const parseIntSafe = (v, dv) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : dv;
};
const STATUTS = new Set(["todo", "in_progress", "review", "done"]);
const PRIORITES = new Set(["low", "medium", "high"]);
const DEFAULT_COLOR = "#7C3AED";

function sanitizeHex(input) {
  try {
    let s = String(input || "")
      .trim()
      .toUpperCase();
    if (!s) return DEFAULT_COLOR;
    if (!s.startsWith("#")) s = "#" + s;
    s =
      "#" +
      s
        .slice(1)
        .replace(/[^0-9A-F]/g, "")
        .slice(0, 6);
    if (s.length !== 7) return DEFAULT_COLOR;
    return s;
  } catch {
    return DEFAULT_COLOR;
  }
}

/**
 * garde le comportement actuel pour les URL "normales"
 * (mais on va bypass ça si c'est une data URL, pour envoyer dans storage)
 */
function sanitizeImageUrl(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  if (s.startsWith("data:image/")) {
    // on ne renvoie pas la data ici, on va essayer de l’uploader
    return s;
  }
  return clampStr(s, 2000);
}

/* ---------- helper upload image ---------- */
/**
 * dataUrl: "data:image/png;base64,xxxx"
 * return: secure_url string
 */
async function uploadDataUrlToCloudinary(dataUrl, { userId, taskId } = {}) {
  try {
    if (!dataUrl || typeof dataUrl !== "string") return "";
    if (!dataUrl.startsWith("data:image/")) return "";

    // data:image/png;base64,AAAA
    const [, mime, b64] =
      dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/) || [];
    if (!b64) return "";

    const buffer = Buffer.from(b64, "base64");
    const publicId =
      (userId ? `user_${userId}_` : "") +
      (taskId ? `task_${taskId}_` : "") +
      Date.now();

    const res = await uploadImageBuffer(buffer, {
      folder: "kanban-tasks",
      publicId,
    });

    return res?.secure_url || "";
  } catch (e) {
    console.error("cloudinary/bunny upload error", e);
    return "";
  }
}

/* auth */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* no-cache */
router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ================= PROJECTS ================= */
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const limit = Math.min(Math.max(parseIntSafe(req.query.limit, 24), 1), 100);
    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();
    const q = clampStr(req.query.q, 160);

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { description: re }];
    }

    const rows = await Project.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const payload = items.map((p) => ({
      id: String(p._id),
      nom: p.name || "Sans nom",
      description: p.description || "",
      color: p.color || DEFAULT_COLOR,
      createdAt: toISO(p.createdAt),
      updatedAt: toISO(p.updatedAt),
    }));

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? String(new Date(last.updatedAt).getTime()) : null;

    return res
      .status(200)
      .json({ ok: true, data: { items: payload, nextCursor } });
  } catch (e) {
    console.error("KANBAN projects list error", e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.get("/projects/:id", requireAuth, async (req, res) => {
  try {
    const p = await Project.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!p)
      return res.status(404).json({ ok: false, error: "Projet introuvable" });

    const tasks = await Task.find({
      project: p._id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    const projectColor = p.color || DEFAULT_COLOR;

    const taches = tasks.map((t) => ({
      id: String(t._id),
      titre: t.titre,
      etiquette: t.etiquette || "",
      echeance: t.echeance ? toISO(t.echeance) : null,
      priorite: t.priorite || "medium",
      statut: t.statut || "todo",
      terminee: !!t.terminee,
      imageUrl: t.imageUrl || "",
      notes: t.notes || "",
      icon: t.icon || "",
      projectColor,
      createdAt: toISO(t.createdAt),
      updatedAt: toISO(t.updatedAt),
    }));

    return res.status(200).json({
      ok: true,
      data: {
        project: {
          id: String(p._id),
          nom: p.name || "Sans nom",
          description: p.description || "",
          color: projectColor,
          createdAt: toISO(p.createdAt),
          updatedAt: toISO(p.updatedAt),
          taches,
        },
      },
    });
  } catch (e) {
    console.error("KANBAN project one error", e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.post("/projects", requireAuth, async (req, res) => {
  try {
    const name = clampStr(req.body?.name || req.body?.nom || "Sans nom", 120);
    const description = clampStr(req.body?.description || "", 400);
    const color = sanitizeHex(req.body?.color);

    const p = await Project.create({
      user: req.auth.userId,
      name,
      description,
      color,
    });

    return res.status(201).json({
      ok: true,
      data: { id: String(p._id), updatedAt: toISO(p.updatedAt) },
    });
  } catch (e) {
    console.error("KANBAN project create error", e);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

router.patch("/projects/:id", requireAuth, async (req, res) => {
  try {
    const p = await Project.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!p)
      return res.status(404).json({ ok: false, error: "Projet introuvable" });

    if (req.body?.name !== undefined || req.body?.nom !== undefined) {
      p.name = clampStr(req.body.name ?? req.body.nom, 120) || "Sans nom";
    }
    if (req.body?.description !== undefined) {
      p.description = clampStr(req.body.description, 400);
    }
    if (req.body?.color !== undefined) {
      p.color = sanitizeHex(req.body.color);
    }

    await p.save();
    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(p.updatedAt) } });
  } catch (e) {
    console.error("KANBAN project patch error", e);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

router.delete("/projects/:id", requireAuth, async (req, res) => {
  try {
    const p = await Project.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!p)
      return res.status(404).json({ ok: false, error: "Projet introuvable" });
    p.deletedAt = new Date();
    await p.save();
    await Task.updateMany(
      { user: req.auth.userId, project: p._id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error("KANBAN project delete error", e);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ================= TASKS ================= */
router.get("/tasks", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const limit = Math.min(Math.max(parseIntSafe(req.query.limit, 50), 1), 200);
    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };
    if (req.query.projectId) filter.project = req.query.projectId;
    if (req.query.statut && STATUTS.has(req.query.statut))
      filter.statut = req.query.statut;
    if (req.query.priorite && PRIORITES.has(req.query.priorite))
      filter.priorite = req.query.priorite;

    const q = clampStr(req.query.q, 160);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ titre: re }, { etiquette: re }, { notes: re }];
    }

    const rows = await Task.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const projIds = [...new Set(items.map((t) => String(t.project)))];
    const projs = await Project.find({
      _id: { $in: projIds },
      user: userId,
    }).lean();
    const colorMap = new Map(
      projs.map((p) => [String(p._id), p.color || DEFAULT_COLOR])
    );

    const payload = items.map((t) => ({
      id: String(t._id),
      projectId: String(t.project),
      projectColor: colorMap.get(String(t.project)) || DEFAULT_COLOR,
      titre: t.titre,
      etiquette: t.etiquette || "",
      echeance: t.echeance ? toISO(t.echeance) : null,
      priorite: t.priorite || "medium",
      statut: t.statut || "todo",
      terminee: !!t.terminee,
      imageUrl: t.imageUrl || "",
      notes: t.notes || "",
      icon: t.icon || "",
      createdAt: toISO(t.createdAt),
      updatedAt: toISO(t.updatedAt),
    }));

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? String(new Date(last.updatedAt).getTime()) : null;
    return res
      .status(200)
      .json({ ok: true, data: { items: payload, nextCursor } });
  } catch (e) {
    console.error("KANBAN tasks list error", e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.post("/tasks", requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const projectId = String(b.projectId || b.project || "");
    if (!projectId)
      return res.status(400).json({ ok: false, error: "projectId requis" });

    const p = await Project.findOne({
      _id: projectId,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!p)
      return res.status(404).json({ ok: false, error: "Projet introuvable" });

    const titre = clampStr(b.titre || "Nouvelle tâche", 300);
    const etiquette = clampStr(b.etiquette || "", 160);
    const echeance = b.echeance ? new Date(b.echeance) : null;
    const priorite = PRIORITES.has(b.priorite) ? b.priorite : "medium";
    const statut = STATUTS.has(b.statut) ? b.statut : "todo";
    const terminee = !!b.terminee;
    const rawImage = sanitizeImageUrl(b.imageUrl || "");
    const notes = clampStr(b.notes || "", 5000);
    const icon = clampStr(b.icon || b.icone || "", 60);

    // 👇 si c’est une data URL → on upload
    let finalImageUrl = "";
    if (rawImage && rawImage.startsWith("data:image/")) {
      finalImageUrl = await uploadDataUrlToCloudinary(rawImage, {
        userId: req.auth.userId,
      });
    } else {
      finalImageUrl = rawImage;
    }

    const t = await Task.create({
      user: req.auth.userId,
      project: projectId,
      titre,
      etiquette,
      echeance,
      priorite,
      statut,
      terminee,
      imageUrl: finalImageUrl,
      notes,
      icon,
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: String(t._id),
        updatedAt: toISO(t.updatedAt),
        imageUrl: t.imageUrl || "",
      },
    });
  } catch (e) {
    console.error("KANBAN task create error", e);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

router.patch("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const t = await Task.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!t)
      return res.status(404).json({ ok: false, error: "Tâche introuvable" });

    const b = req.body || {};
    if (b.projectId) {
      const p = await Project.findOne({
        _id: b.projectId,
        user: req.auth.userId,
        deletedAt: null,
      }).lean();
      if (!p)
        return res.status(404).json({ ok: false, error: "Projet introuvable" });
      t.project = p._id;
    }
    if (b.titre !== undefined) t.titre = clampStr(b.titre, 300) || t.titre;
    if (b.etiquette !== undefined) t.etiquette = clampStr(b.etiquette, 160);
    if (b.echeance !== undefined)
      t.echeance = b.echeance ? new Date(b.echeance) : null;
    if (b.priorite && PRIORITES.has(b.priorite)) t.priorite = b.priorite;
    if (b.statut && STATUTS.has(b.statut)) t.statut = b.statut;
    if (b.terminee !== undefined) t.terminee = !!b.terminee;

    if (b.imageUrl !== undefined) {
      const rawImage = sanitizeImageUrl(b.imageUrl || "");
      if (rawImage && rawImage.startsWith("data:image/")) {
        const uploaded = await uploadDataUrlToCloudinary(rawImage, {
          userId: req.auth.userId,
          taskId: t._id.toString(),
        });
        t.imageUrl = uploaded || "";
      } else {
        t.imageUrl = rawImage;
      }
    }

    if (b.notes !== undefined) t.notes = clampStr(b.notes, 5000);
    if (b.icon !== undefined || b.icone !== undefined)
      t.icon = clampStr(b.icon ?? b.icone, 60);

    await t.save();
    return res.status(200).json({
      ok: true,
      data: {
        updatedAt: toISO(t.updatedAt),
        imageUrl: t.imageUrl || "",
      },
    });
  } catch (e) {
    console.error("KANBAN task patch error", e);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const t = await Task.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!t)
      return res.status(404).json({ ok: false, error: "Tâche introuvable" });
    t.deletedAt = new Date();
    await t.save();
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error("KANBAN task delete error", e);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

module.exports = router;
