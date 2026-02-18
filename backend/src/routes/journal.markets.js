// backend/src/routes/journal.markets.js
const express = require("express");
const crypto = require("node:crypto");
const Market = require("../models/market.model");
const { verifyAuthHeader } = require("./auth/_helpers");

const router = express.Router();

/* ---------- utils ---------- */
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
const parseBool = (v) => v === true || v === "true" || v === 1 || v === "1";

/* ---------- middlewares ---------- */
router.use((req, _res, next) => {
  req._rid =
    req._rid ||
    (typeof crypto.randomUUID === "function"
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

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      console.warn(
        `[MARKETS ${req._rid}] AUTH FAIL — headers: ${short(req.headers)}`
      );
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    console.warn(`[MARKETS ${req._rid}] AUTH EXCEPTION — ${e?.message || e}`);
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ---------- LIST ---------- */
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
    const pinned =
      req.query.pinned != null ? parseBool(req.query.pinned) : undefined;

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };
    if (q) {
      // Regex “safe” (pas de $text ⇒ pas d’index texte requis)
      filter.name = {
        $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }
    if (typeof pinned === "boolean") filter.pinned = pinned;

    const rows = await Market.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const payloadItems = items.map((m) => ({
      id: String(m._id),
      name: String(m.name || "Sans nom"),
      createdAt: toISO(m.createdAt),
      updatedAt: toISO(m.updatedAt),
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
      `[MARKETS ${rid}] GET OK — count=${payloadItems.length} next=${
        out.data.nextCursor
      } (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[MARKETS ${rid}] GET ERROR (${Date.now() - req._t0}ms): ${e?.stack || e}`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------- READ ---------- */
router.get("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const m = await Market.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    }).lean();

    if (!m) {
      console.warn(`[MARKETS ${rid}] GET one — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Marché introuvable" });
    }

    return res.status(200).json({
      ok: true,
      data: {
        market: {
          id: String(m._id),
          name: String(m.name || "Sans nom"),
          createdAt: toISO(m.createdAt),
          updatedAt: toISO(m.updatedAt),
        },
      },
    });
  } catch (e) {
    console.error(
      `[MARKETS ${rid}] GET one ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ---------- CREATE ---------- */
router.post("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const name = clampStr(req.body?.name, 160) || "Sans nom";

    const doc = await Market.create({
      user: userId,
      name,
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: String(doc._id),
        updatedAt: toISO(doc.updatedAt),
      },
    });
  } catch (e) {
    console.error(
      `[MARKETS ${rid}] POST ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ---------- UPDATE ---------- */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const m = await Market.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });

    if (!m) {
      console.warn(`[MARKETS ${rid}] PATCH — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Marché introuvable" });
    }

    if (req.body?.name !== undefined)
      m.name = clampStr(req.body.name, 160) || "Sans nom";

    await m.save();

    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(m.updatedAt) } });
  } catch (e) {
    console.error(
      `[MARKETS ${rid}] PATCH ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ---------- DELETE (soft) ---------- */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const m = await Market.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });

    if (!m) {
      console.warn(`[MARKETS ${rid}] DELETE — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Marché introuvable" });
    }

    m.deletedAt = new Date();
    await m.save();

    // ✅ Clear marketId and marketName from journal entries
    try {
      const JournalEntry = require("../models/journalEntry.model");
      const result = await JournalEntry.updateMany(
        { user: userId, marketId: String(m._id) },
        { $set: { marketId: "", marketName: "" } }
      );
      console.log(
        `[MARKETS ${rid}] Cleared marketId from ${result.modifiedCount || 0} journal entries`
      );
    } catch (cleanupErr) {
      console.error(`[MARKETS ${rid}] Cleanup ERROR:`, cleanupErr);
      // Don't fail the delete if cleanup fails
    }

    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(
      `[MARKETS ${rid}] DELETE ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

module.exports = router;
