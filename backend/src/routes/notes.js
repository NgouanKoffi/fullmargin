// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\notes.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto"); // FIX: import crypto
const multer = require("multer");
const Note = require("../models/note.model");
const { verifyAuthHeader } = require("./auth/_helpers"); // on n'utilise plus ok/fail ici
const { uploadBuffer } = require("../utils/storage");

/* ===== Logger utils ===== */
const MAX_SHOW = 800;
const safe = (v) => {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
};
const short = (v, n = MAX_SHOW) => (safe(v) || "").slice(0, n);

/* req.id + timing */
router.use((req, _res, next) => {
  // FIX: plus de optional chaining sur un identifiant non déclaré
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

/* utils */
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const parseBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const toISO = (d) => {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return x.toISOString();
  } catch {
    return "";
  }
};

/* auth middleware */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      console.warn(
        `[NOTES ${req._rid}] AUTH FAIL — headers: ${short(req.headers)}`
      );
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    console.warn(`[NOTES ${req._rid}] AUTH EXCEPTION — ${e?.message || e}`);
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ================= MULTER POUR IMAGES (notes) ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype)) {
      return cb(new Error("TYPE_NOT_ALLOWED"));
    }
    cb(null, true);
  },
});

/* ================= UPLOAD IMAGE (BUNNY) ================= */
/**
 * POST /api/notes/upload-image
 * Body: FormData("file" => image)
 * Retour: { ok: true, url: "https://fullmargin-cdn.b-cdn.net/notes/..." }
 */
router.post(
  "/upload-image",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    const rid = req._rid;
    try {
      console.log(
        `[NOTES ${rid}] POST /notes/upload-image — user=${
          req.auth.userId
        } file=${short({
          originalname: req.file?.originalname,
          mimetype: req.file?.mimetype,
          size: req.file?.size,
        })}`
      );

      if (!req.file?.buffer) {
        return res.status(400).json({ ok: false, error: "Aucun fichier reçu" });
      }

      const userId = req.auth.userId;

      const up = await uploadBuffer(req.file.buffer, {
        folder: "notes",
        publicId: `u_${userId}_${Date.now()}`,
        resourceType: "image",
      });

      console.log(
        `[NOTES ${rid}] UPLOAD IMAGE OK — path=${up.public_id} url=${
          up.secure_url
        } (${Date.now() - req._t0}ms)`
      );

      return res.status(201).json({ ok: true, url: up.secure_url });
    } catch (err) {
      if (err?.message === "TYPE_NOT_ALLOWED") {
        console.warn(`[NOTES ${rid}] UPLOAD IMAGE TYPE_NOT_ALLOWED`);
        return res.status(415).json({
          ok: false,
          error: "Type de fichier interdit (image uniquement)",
        });
      }
      if (err?.code === "LIMIT_FILE_SIZE") {
        console.warn(`[NOTES ${rid}] UPLOAD IMAGE LIMIT_FILE_SIZE`);
        return res.status(413).json({
          ok: false,
          error: "Image trop lourde (max 8MB)",
        });
      }

      console.error(
        `[NOTES ${rid}] POST /notes/upload-image ERROR (${
          Date.now() - req._t0
        }ms): ${err?.stack || err}`
      );
      return res
        .status(500)
        .json({ ok: false, error: "Échec de l’upload de l’image" });
    }
  }
);

/* ================= LISTE ================= */
router.get("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[NOTES ${rid}] GET /notes — user=${req.auth.userId} query=${short(
        req.query
      )}`
    );

    const userId = req.auth.userId;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "24", 10), 1),
      100
    );
    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();
    const q = clampStr(req.query.q, 160);
    const pinned =
      req.query.pinned != null ? parseBool(req.query.pinned) : undefined;

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };
    if (q)
      filter.title = {
        $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    if (typeof pinned === "boolean") filter.pinned = pinned;

    const rows = await Note.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const payloadItems = items.map((n) => ({
      id: String(n._id),
      title: n.title || "Sans titre",
      updatedAt: toISO(n.updatedAt),
      pinned: !!n.pinned,
      tags: Array.isArray(n.tags) ? n.tags : [],
    }));

    const last = items[items.length - 1];
    const lastTs = last ? new Date(last.updatedAt).getTime() : null;
    const out = {
      ok: true,
      data: {
        items: payloadItems,
        nextCursor: hasMore && lastTs ? String(lastTs) : null,
      },
    };

    console.log(
      `[NOTES ${rid}] GET /notes OK — count=${payloadItems.length} nextCursor=${
        out.data.nextCursor
      } (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[NOTES ${rid}] GET /notes ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ================= LECTURE ================= */
router.get("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[NOTES ${rid}] GET /notes/${req.params.id} — user=${req.auth.userId}`
    );

    const userId = req.auth.userId;
    const note = await Note.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    }).lean();
    if (!note) {
      console.warn(`[NOTES ${rid}] GET one — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Note introuvable" });
    }

    const out = {
      ok: true,
      data: {
        note: {
          id: String(note._id),
          title: note.title || "Sans titre",
          doc: note.doc ?? [{ type: "paragraph", content: "" }],
          pinned: !!note.pinned,
          tags: Array.isArray(note.tags) ? note.tags : [],
          createdAt: toISO(note.createdAt),
          updatedAt: toISO(note.updatedAt),
        },
      },
    };
    console.log(`[NOTES ${rid}] GET one OK (${Date.now() - req._t0}ms)`);
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[NOTES ${rid}] GET /notes/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ================= CRÉATION ================= */
router.post("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[NOTES ${rid}] POST /notes — user=${req.auth.userId} body=${short(
        req.body
      )}`
    );

    const userId = req.auth.userId;
    const b = req.body || {};
    const title = clampStr(b.title || "Sans titre", 160);
    const doc = b.doc ?? [{ type: "paragraph", content: "" }];
    const pinned = !!b.pinned;
    const tags = Array.isArray(b.tags)
      ? b.tags.map((x) => clampStr(x, 40)).slice(0, 20)
      : [];

    const note = await Note.create({ user: userId, title, doc, pinned, tags });

    const out = {
      ok: true,
      data: { id: String(note._id), updatedAt: toISO(note.updatedAt) },
    };
    console.log(
      `[NOTES ${rid}] POST OK id=${out.data.id} updatedAt=${
        out.data.updatedAt
      } (${Date.now() - req._t0}ms)`
    );
    return res.status(201).json(out);
  } catch (e) {
    console.error(
      `[NOTES ${rid}] POST /notes ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n` + `  headers=${short(req.headers)}\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ================= MISE À JOUR ================= */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[NOTES ${rid}] PATCH /notes/${req.params.id} — user=${
        req.auth.userId
      } body=${short(req.body)}`
    );

    const userId = req.auth.userId;
    const note = await Note.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!note) {
      console.warn(`[NOTES ${rid}] PATCH — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Note introuvable" });
    }

    const b = req.body || {};
    if (b.title !== undefined)
      note.title = clampStr(b.title, 160) || "Sans titre";
    if (b.doc !== undefined) note.doc = b.doc;
    if (b.pinned !== undefined) note.pinned = !!b.pinned;
    if (Array.isArray(b.tags))
      note.tags = b.tags.map((x) => clampStr(x, 40)).slice(0, 20);

    await note.save();

    const out = { ok: true, data: { updatedAt: toISO(note.updatedAt) } };
    console.log(
      `[NOTES ${rid}] PATCH OK id=${note._id} updatedAt=${
        out.data.updatedAt
      } (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[NOTES ${rid}] PATCH /notes/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n` + `  headers=${short(req.headers)}\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ================= SUPPRESSION ================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[NOTES ${rid}] DELETE /notes/${req.params.id} — user=${req.auth.userId}`
    );

    const userId = req.auth.userId;
    const note = await Note.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!note) {
      console.warn(`[NOTES ${rid}] DELETE — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Note introuvable" });
    }

    note.deletedAt = new Date();
    await note.save();

    console.log(
      `[NOTES ${rid}] DELETE OK id=${note._id} (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(
      `[NOTES ${rid}] DELETE /notes/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

module.exports = router;
