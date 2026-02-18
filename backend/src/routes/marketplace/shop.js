// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\shop.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");

// ✅ chemins corrigés
const Shop = require("../../models/shop.model");
const { verifyAuthHeader } = require("../auth/_helpers"); // même helper que notes

/* ===== Logger utils (même style que notes) ===== */
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

/* auth middleware */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      console.warn(
        `[SHOPS ${req._rid}] AUTH FAIL — headers: ${short(req.headers)}`
      );
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    console.warn(`[SHOPS ${req._rid}] AUTH EXCEPTION — ${e?.message || e}`);
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ================== LIRE MA BOUTIQUE ==================
   Renvoie la boutique active (non supprimée) de l'utilisateur courant. */
router.get("/me", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(`[SHOPS ${rid}] GET /shops/me — user=${req.auth.userId}`);
    const shop = await Shop.findOne({
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!shop) {
      return res.status(404).json({ ok: false, error: "Aucune boutique" });
    }
    const out = {
      ok: true,
      data: {
        shop: {
          id: String(shop._id),
          name: shop.name,
          desc: shop.desc,
          signature: shop.signature,
          avatarUrl: shop.avatarUrl || "",
          coverUrl: shop.coverUrl || "",
          slug: shop.slug || "",
          createdAt: toISO(shop.createdAt),
          updatedAt: toISO(shop.updatedAt),
        },
      },
    };
    console.log(`[SHOPS ${rid}] GET /shops/me OK (${Date.now() - req._t0}ms)`);
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[SHOPS ${rid}] GET /shops/me ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ================== CRÉER MA BOUTIQUE ==================
   Contrainte: 1 boutique active par utilisateur.
   Si une boutique active existe déjà => 409 Conflict. */
router.post("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[SHOPS ${rid}] POST /shops — user=${req.auth.userId} body=${short(
        req.body
      )}`
    );

    const userId = req.auth.userId;

    // Vérifier qu'il n'existe pas déjà une boutique active
    const existing = await Shop.findOne({
      user: userId,
      deletedAt: null,
    }).lean();
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "Une boutique existe déjà." });
    }

    // Champs attendus (mêmes limites que le front actuel)
    const b = req.body || {};
    const name = clampStr(b.name, 30);
    const desc = clampStr(b.desc, 200);
    const signature = clampStr(b.signature, 20);
    const avatarUrl = clampStr(b.avatarUrl || b.avatarDataUrl || "", 500000); // DataURL tolérée
    const coverUrl = clampStr(b.coverUrl || b.coverDataUrl || "", 500000);

    if (!name || !desc || !signature) {
      return res
        .status(400)
        .json({ ok: false, error: "Champs requis manquants." });
    }

    const shop = await Shop.create({
      user: userId,
      name,
      desc,
      signature,
      avatarUrl,
      coverUrl,
    });

    const out = {
      ok: true,
      data: {
        id: String(shop._id),
        slug: shop.slug || "",
        updatedAt: toISO(shop.updatedAt),
      },
    };
    console.log(
      `[SHOPS ${rid}] POST OK id=${out.data.id} slug=${out.data.slug} (${
        Date.now() - req._t0
      }ms)`
    );
    return res.status(201).json(out);
  } catch (e) {
    console.error(
      `[SHOPS ${rid}] POST /shops ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n` + `  headers=${short(req.headers)}\n  body=${short(req.body)}`
    );
    if (String(e?.code) === "11000") {
      return res
        .status(409)
        .json({ ok: false, error: "Une boutique existe déjà." });
    }
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ================== METTRE À JOUR ================== */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[SHOPS ${rid}] PATCH /shops/${req.params.id} — user=${
        req.auth.userId
      } body=${short(req.body)}`
    );

    const userId = req.auth.userId;
    const shop = await Shop.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!shop) {
      console.warn(`[SHOPS ${rid}] PATCH — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    const b = req.body || {};
    if (b.name !== undefined) shop.name = clampStr(b.name, 30) || shop.name;
    if (b.desc !== undefined) shop.desc = clampStr(b.desc, 200) || shop.desc;
    if (b.signature !== undefined)
      shop.signature = clampStr(b.signature, 20) || shop.signature;
    if (b.avatarUrl !== undefined)
      shop.avatarUrl = clampStr(b.avatarUrl, 500000);
    if (b.coverUrl !== undefined) shop.coverUrl = clampStr(b.coverUrl, 500000);

    await shop.save();

    const out = {
      ok: true,
      data: { updatedAt: toISO(shop.updatedAt), slug: shop.slug || "" },
    };
    console.log(
      `[SHOPS ${rid}] PATCH OK id=${shop._id} updatedAt=${
        out.data.updatedAt
      } (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[SHOPS ${rid}] PATCH /shops/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }\n` + `  headers=${short(req.headers)}\n  body=${short(req.body)}`
    );
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ================== SUPPRIMER (soft delete) ================== */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[SHOPS ${rid}] DELETE /shops/${req.params.id} — user=${req.auth.userId}`
    );

    const userId = req.auth.userId;
    const shop = await Shop.findOne({
      _id: req.params.id,
      user: userId,
      deletedAt: null,
    });
    if (!shop) {
      console.warn(`[SHOPS ${rid}] DELETE — NOT FOUND id=${req.params.id}`);
      return res.status(404).json({ ok: false, error: "Boutique introuvable" });
    }

    shop.deletedAt = new Date();
    await shop.save();

    console.log(
      `[SHOPS ${rid}] DELETE OK id=${shop._id} (${Date.now() - req._t0}ms)`
    );
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(
      `[SHOPS ${rid}] DELETE /shops/:id ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ================== LISTE (optionnel/admin) ================== */
router.get("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[SHOPS ${rid}] GET /shops — user=${req.auth.userId} query=${short(
        req.query
      )}`
    );

    const userId = req.auth.userId;
    const includeDeleted =
      req.query.includeDeleted === "1" || req.query.includeDeleted === "true";

    const filter = { user: userId };
    if (!includeDeleted) filter.deletedAt = null;

    const rows = await Shop.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    const items = rows.map((s) => ({
      id: String(s._id),
      name: s.name,
      desc: s.desc,
      signature: s.signature,
      avatarUrl: s.avatarUrl || "",
      coverUrl: s.coverUrl || "",
      slug: s.slug || "",
      deletedAt: s.deletedAt ? toISO(s.deletedAt) : null,
      updatedAt: toISO(s.updatedAt),
    }));

    const out = { ok: true, data: { items } };
    console.log(
      `[SHOPS ${rid}] GET /shops OK count=${items.length} (${
        Date.now() - req._t0
      }ms)`
    );
    return res.status(200).json(out);
  } catch (e) {
    console.error(
      `[SHOPS ${rid}] GET /shops ERROR (${Date.now() - req._t0}ms): ${
        e?.stack || e
      }`
    );
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

module.exports = router;
