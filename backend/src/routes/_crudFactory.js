// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\_crudFactory.js
const express = require("express");
const crypto = require("node:crypto"); // ✅ manquait
const { verifyAuthHeader } = require("./auth/_helpers");

const MAX_SHOW = 800;
const safe = (v) => {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
};
const short = (v, n = MAX_SHOW) => (safe(v) || "").slice(0, n);

const toISO = (d) => {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return x.toISOString();
  } catch {
    return "";
  }
};
const clampStr = (v, max) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

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

function makeCrudRouter(Model, cfg) {
  const {
    name, // pour logs
    searchFields = ["name"], // champs texte (regex i)
    pickCreate, // (body) => data
    pickUpdate, // (body, existing) => partial update
    serialize, // (doc) => item renvoyé
  } = cfg;

  const router = express.Router();

  // log + no-cache
  router.use((req, _res, next) => {
    req._rid =
      req._rid ||
      (typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    req._t0 = Date.now();
    next();
  });
  router.use((_req, res, next) => {
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  // LIST
  router.get("/", requireAuth, async (req, res) => {
    const rid = req._rid;
    try {
      const userId = req.auth.userId;
      const limit = Math.min(
        Math.max(parseInt(req.query.limit || "200", 10), 1),
        500
      );
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
        filter.$or = searchFields.map((f) => ({
          [f]: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }));
      }

      const rows = await Model.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean();
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const payloadItems = items.map((m) => serialize(m));
      const last = items[items.length - 1];
      const lastTs = last ? new Date(last.updatedAt).getTime() : null;

      console.log(
        `[${name} ${rid}] GET OK — count=${
          payloadItems.length
        } next=${lastTs} (${Date.now() - req._t0}ms)`
      );
      return res.status(200).json({
        ok: true,
        data: {
          items: payloadItems,
          nextCursor: hasMore && lastTs ? String(lastTs) : null,
        },
      });
    } catch (e) {
      console.error(
        `[${name} ${rid}] GET ERROR (${Date.now() - req._t0}ms): ${
          e?.stack || e
        }`
      );
      return res
        .status(500)
        .json({ ok: false, error: "Chargement impossible" });
    }
  });

  // CREATE
  router.post("/", requireAuth, async (req, res) => {
    const rid = req._rid;
    try {
      const userId = req.auth.userId;
      const data = pickCreate(req.body || {});
      const doc = await Model.create({ ...data, user: userId });
      console.log(
        `[${name} ${rid}] POST OK id=${doc._id} (${Date.now() - req._t0}ms)`
      );
      return res.status(201).json({
        ok: true,
        data: { id: String(doc._id), updatedAt: toISO(doc.updatedAt) },
      });
    } catch (e) {
      if (e?.code === 11000)
        return res.status(409).json({ ok: false, error: "Doublon" });
      console.error(
        `[${name} ${rid}] POST ERROR (${Date.now() - req._t0}ms): ${
          e?.stack || e
        }\n body=${short(req.body)}`
      );
      return res.status(500).json({ ok: false, error: "Création impossible" });
    }
  });

  // UPDATE
  router.patch("/:id", requireAuth, async (req, res) => {
    const rid = req._rid;
    try {
      const userId = req.auth.userId;
      const doc = await Model.findOne({
        _id: req.params.id,
        user: userId,
        deletedAt: null,
      });
      if (!doc)
        return res.status(404).json({ ok: false, error: "Introuvable" });
      pickUpdate(req.body || {}, doc);
      await doc.save();
      console.log(
        `[${name} ${rid}] PATCH OK id=${doc._id} (${Date.now() - req._t0}ms)`
      );
      return res
        .status(200)
        .json({ ok: true, data: { updatedAt: toISO(doc.updatedAt) } });
    } catch (e) {
      if (e?.code === 11000)
        return res.status(409).json({ ok: false, error: "Doublon" });
      console.error(
        `[${name} ${rid}] PATCH ERROR (${Date.now() - req._t0}ms): ${
          e?.stack || e
        }\n body=${short(req.body)}`
      );
      return res
        .status(500)
        .json({ ok: false, error: "Sauvegarde impossible" });
    }
  });

  // DELETE (soft)
  router.delete("/:id", requireAuth, async (req, res) => {
    const rid = req._rid;
    try {
      const userId = req.auth.userId;
      const doc = await Model.findOne({
        _id: req.params.id,
        user: userId,
        deletedAt: null,
      });
      if (!doc)
        return res.status(404).json({ ok: false, error: "Introuvable" });
      
      doc.deletedAt = new Date();
      await doc.save();
      
      // ✅ Execute custom cleanup if provided
      if (typeof cfg.onDelete === "function") {
        try {
          await cfg.onDelete(doc, userId);
        } catch (cleanupErr) {
          console.error(
            `[${name} ${rid}] onDelete hook ERROR: ${cleanupErr?.stack || cleanupErr}`
          );
          // Don't fail the delete if cleanup fails
        }
      }
      
      console.log(
        `[${name} ${rid}] DELETE OK id=${doc._id} (${Date.now() - req._t0}ms)`
      );
      return res.status(200).json({ ok: true, data: { deleted: true } });
    } catch (e) {
      console.error(
        `[${name} ${rid}] DELETE ERROR (${Date.now() - req._t0}ms): ${
          e?.stack || e
        }`
      );
      return res
        .status(500)
        .json({ ok: false, error: "Suppression impossible" });
    }
  });

  return router;
}

module.exports = { makeCrudRouter, clampStr, toISO, requireAuth };
