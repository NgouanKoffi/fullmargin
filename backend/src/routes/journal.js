// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\journal.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const JournalEntry = require("../models/journalEntry.model");
const JournalAccount = require("../models/journalAccount.model");
const Market = require("../models/market.model");
const Strategy = require("../models/strategy.model");
const { verifyAuthHeader } = require("./auth/_helpers");
const { uploadImageBuffer } = require("../utils/storage");

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
  String(v ?? "")
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

/* auth middleware */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      console.warn(
        `[JOURNAL ${req._rid}] AUTH FAIL — headers: ${short(req.headers)}`
      );
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    console.warn(`[JOURNAL ${req._rid}] AUTH EXCEPTION — ${e?.message || e}`);
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ------------ helpers pour nommer et uploader ------------- */

function dataUrlToBuffer(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!m) return null;
  try {
    return Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
}

// upload 1 image (dataURL) -> url cloudinary
async function uploadOneImageFromDataUrl(userId, dataUrl, idx = 0) {
  const buf = dataUrlToBuffer(dataUrl);
  if (!buf) return "";
  const publicId = `${userId}_${Date.now()}_${idx}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const res = await uploadImageBuffer(buf, {
    folder: "journal",
    publicId,
  });
  return res.secure_url || "";
}

/**
 * Normalise les images envoyées par le front.
 * - garde les URL déjà en http(s)
 * - upload les dataURL sur Cloudinary
 * - limite à 5
 */
async function normalizeImages(userId, body) {
  const out = [];

  const srcList = Array.isArray(body.images)
    ? body.images
    : body.imageDataUrl
    ? [body.imageDataUrl]
    : body.imageUrl
    ? [body.imageUrl]
    : [];

  for (let i = 0; i < srcList.length && i < 5; i++) {
    const src = String(srcList[i] || "").trim();
    if (!src) continue;

    if (/^https?:\/\//i.test(src)) {
      out.push(src);
    } else if (src.startsWith("data:image")) {
      try {
        const url = await uploadOneImageFromDataUrl(userId, src, i);
        if (url) out.push(url);
      } catch (err) {
        console.warn("[journal] upload image failed:", err?.message || err);
      }
    } else {
      // on ignore
    }
  }

  return out;
}

/* petit helper pour compléter les ...Name si manquants */
async function hydrateNames(userId, body) {
  const out = { ...body };
  const jobs = [];

  if (out.accountId && !out.accountName) {
    jobs.push(
      (async () => {
        const acc = await JournalAccount.findOne({
          _id: out.accountId,
          user: userId,
          deletedAt: null,
        }).lean();
        if (acc) out.accountName = acc.name || "";
      })()
    );
  }

  if (out.marketId && !out.marketName) {
    jobs.push(
      (async () => {
        const m = await Market.findOne({
          _id: out.marketId,
          user: userId,
          deletedAt: null,
        }).lean();
        if (m) out.marketName = m.name || "";
      })()
    );
  }

  if (out.strategyId && !out.strategyName) {
    jobs.push(
      (async () => {
        const s = await Strategy.findOne({
          _id: out.strategyId,
          user: userId,
          deletedAt: null,
        }).lean();
        if (s) out.strategyName = s.name || "";
      })()
    );
  }

  if (jobs.length) await Promise.all(jobs);
  return out;
}

/* ================= LISTE ================= */
router.get("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
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
    const accountId = clampStr(req.query.accountId, 200);
    const result = clampStr(req.query.result, 10);
    const dateFrom = clampStr(req.query.dateFrom, 10);
    const dateTo = clampStr(req.query.dateTo, 10);

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      filter.$or = [
        { accountName: re },
        { marketName: re },
        { strategyName: re },
        { detail: re },
        { comment: re },
        { order: re },
        { result: re },
        { session: re },
        { date: re },
      ];
    }

    if (accountId) filter.accountId = accountId;
    if (result && ["Gain", "Perte", "Nul"].includes(result))
      filter.result = result;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const rows = await JournalEntry.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const payloadItems = items.map((n) => ({
      id: String(n._id),
      date: n.date || "",

      accountId: n.accountId || "",
      accountName: n.accountName || "",
      marketId: n.marketId || "",
      marketName: n.marketName || "",
      strategyId: n.strategyId || "",
      strategyName: n.strategyName || "",

      // 💰 trade
      order: n.order || "",
      lot: n.lot || "",
      result: n.result || "",
      detail: n.detail || "",

      invested: n.invested || "",
      resultMoney: n.resultMoney || "",
      resultPct: n.resultPct || "",

      respect: n.respect || "",
      duration: n.duration || "",
      timeframes: Array.isArray(n.timeframes) ? n.timeframes : [],
      session: n.session || "",

      comment: n.comment || "",

      imageDataUrl: n.imageDataUrl || n.imageUrl || "",
      imageUrl: n.imageUrl || n.imageDataUrl || "",
      images: Array.isArray(n.images) ? n.images : [],

      updatedAt: toISO(n.updatedAt),
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

    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[JOURNAL ${rid}] GET /journal ERROR (${Date.now() - req._t0}ms): ${
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
    const userId = req.auth.userId;
    const ent = await JournalEntry.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    }).lean();
    if (!ent) {
      return res.status(404).json({ ok: false, error: "Entrée introuvable" });
    }

    const out = {
      ok: true,
      data: {
        entry: {
          id: String(ent._id),

          accountId: ent.accountId || "",
          accountName: ent.accountName || "",
          marketId: ent.marketId || "",
          marketName: ent.marketName || "",
          strategyId: ent.strategyId || "",
          strategyName: ent.strategyName || "",

          order: ent.order || "",
          lot: ent.lot || "",
          result: ent.result || "",
          detail: ent.detail || "",

          invested: ent.invested || "",
          resultMoney: ent.resultMoney || "",
          resultPct: ent.resultPct || "",

          respect: ent.respect || "",
          duration: ent.duration || "",

          timeframes: Array.isArray(ent.timeframes) ? ent.timeframes : [],
          session: ent.session || "",

          comment: ent.comment || "",

          imageDataUrl: ent.imageDataUrl || "",
          imageUrl: ent.imageUrl || "",
          images: Array.isArray(ent.images) ? ent.images : [],

          date: ent.date || "",
          createdAt: toISO(ent.createdAt),
          updatedAt: toISO(ent.updatedAt),
        },
      },
    };
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[JOURNAL ${rid}] GET /journal/:id ERROR (${Date.now() - req._t0}ms): ${
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
    const userId = req.auth.userId;
    const rawBody = req.body || {};

    const hydrated = await hydrateNames(userId, rawBody);
    const images = await normalizeImages(userId, hydrated);

    const entry = await JournalEntry.create({
      user: userId,

      accountId: clampStr(hydrated.accountId, 200),
      accountName: clampStr(hydrated.accountName, 160),
      marketId: clampStr(hydrated.marketId, 200),
      marketName: clampStr(hydrated.marketName, 160),
      strategyId: clampStr(hydrated.strategyId, 200),
      strategyName: clampStr(hydrated.strategyName, 160),

      order: ["Buy", "Sell"].includes(hydrated.order) ? hydrated.order : "",
      lot: clampStr(hydrated.lot, 40),

      result: ["Gain", "Perte", "Nul"].includes(hydrated.result)
        ? hydrated.result
        : "",
      detail: clampStr(hydrated.detail, 160),

      invested: clampStr(hydrated.invested, 40),
      resultMoney: clampStr(hydrated.resultMoney, 40),
      resultPct: clampStr(hydrated.resultPct, 40),

      respect: ["Oui", "Non"].includes(hydrated.respect)
        ? hydrated.respect
        : "",
      duration: clampStr(hydrated.duration, 40),

      timeframes: Array.isArray(hydrated.timeframes)
        ? hydrated.timeframes.map((x) => clampStr(x, 10)).slice(0, 20)
        : [],
      session: ["london", "newyork", "asiatique"].includes(hydrated.session)
        ? hydrated.session
        : "",

      comment: clampStr(hydrated.comment, 5000),

      imageDataUrl: images[0] || "",
      imageUrl: images[0] || "",
      images,

      date: clampStr(hydrated.date, 10),
    });

    return res.status(201).json({
      ok: true,
      data: { id: String(entry._id), updatedAt: toISO(entry.updatedAt) },
    });
  } catch (e) {
    console.error(
      `[JOURNAL ${rid}] POST /journal ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ================= MISE À JOUR ================= */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const ent = await JournalEntry.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!ent) {
      return res.status(404).json({ ok: false, error: "Entrée introuvable" });
    }

    const hydrated = await hydrateNames(userId, req.body || {});
    const images =
      Array.isArray(hydrated.images) ||
      hydrated.imageDataUrl ||
      hydrated.imageUrl
        ? await normalizeImages(userId, hydrated)
        : null;

    if (hydrated.accountId !== undefined)
      ent.accountId = clampStr(hydrated.accountId, 200);
    if (hydrated.accountName !== undefined)
      ent.accountName = clampStr(hydrated.accountName, 160);
    if (hydrated.marketId !== undefined)
      ent.marketId = clampStr(hydrated.marketId, 200);
    if (hydrated.marketName !== undefined)
      ent.marketName = clampStr(hydrated.marketName, 160);
    if (hydrated.strategyId !== undefined)
      ent.strategyId = clampStr(hydrated.strategyId, 200);
    if (hydrated.strategyName !== undefined)
      ent.strategyName = clampStr(hydrated.strategyName, 160);

    if (hydrated.order !== undefined)
      ent.order = ["Buy", "Sell"].includes(hydrated.order)
        ? hydrated.order
        : "";
    if (hydrated.lot !== undefined) ent.lot = clampStr(hydrated.lot, 40);

    if (hydrated.result !== undefined)
      ent.result = ["Gain", "Perte", "Nul"].includes(hydrated.result)
        ? hydrated.result
        : "";
    if (hydrated.detail !== undefined)
      ent.detail = clampStr(hydrated.detail, 160);

    if (hydrated.invested !== undefined)
      ent.invested = clampStr(hydrated.invested, 40);
    if (hydrated.resultMoney !== undefined)
      ent.resultMoney = clampStr(hydrated.resultMoney, 40);
    if (hydrated.resultPct !== undefined)
      ent.resultPct = clampStr(hydrated.resultPct, 40);

    if (hydrated.respect !== undefined)
      ent.respect = ["Oui", "Non"].includes(hydrated.respect)
        ? hydrated.respect
        : "";
    if (hydrated.duration !== undefined)
      ent.duration = clampStr(hydrated.duration, 40);

    if (Array.isArray(hydrated.timeframes))
      ent.timeframes = hydrated.timeframes
        .map((x) => clampStr(x, 10))
        .slice(0, 20);
    if (hydrated.session !== undefined)
      ent.session = ["london", "newyork", "asiatique"].includes(
        hydrated.session
      )
        ? hydrated.session
        : "";

    if (hydrated.comment !== undefined)
      ent.comment = clampStr(hydrated.comment, 5000);

    if (images) {
      ent.images = images;
      ent.imageDataUrl = images[0] || ent.imageDataUrl;
      ent.imageUrl = images[0] || ent.imageUrl;
    }

    if (hydrated.date !== undefined) ent.date = clampStr(hydrated.date, 10);

    await ent.save();

    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(ent.updatedAt) } });
  } catch (e) {
    console.error(
      `[JOURNAL ${rid}] PATCH /journal/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ================= SUPPRESSION (soft delete) ================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const e = await JournalEntry.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!e) {
      return res.status(404).json({ ok: false, error: "Entrée introuvable" });
    }

    e.deletedAt = new Date();
    await e.save();

    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(
      `[JOURNAL ${rid}] DELETE /journal/:id ERROR (${
        Date.now() - req._t0
      }ms): ${e?.stack || e}`
    );
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

module.exports = router;
