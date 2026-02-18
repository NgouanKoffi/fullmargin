// backend/src/routes/finance.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto"); // ✅ FIX
const Account = require("../models/finance.account.model");
const Tx = require("../models/finance.tx.model");
const FinancePref = require("../models/finance.pref.model"); // ✅ nouveau
const { verifyAuthHeader } = require("./auth/_helpers");

/* ===== logger + no-cache ===== */
const MAX_SHOW = 800;
const safe = (v) => {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
};
const short = (v, n = MAX_SHOW) => (safe(v) || "").slice(0, n);
router.use((req, _res, next) => {
  req._rid =
    req._rid ||
    (typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)); // ✅ FIX
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

/* ===== helpers ===== */
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

// ✅ liste de devises alignée sur le front
const CURRENCIES = new Set([
  "USD",
  "EUR",
  "XOF",
  "XAF",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "CHF",
  "NGN",
  "ZAR",
  "MAD",
  "INR",
  "AED",
  "GHS",
  "KES",
  "BTC",
  "ETH",
  "BNB",
  "USDT",
  "FCFA",
]);

const DETAILS = new Set([
  // cœur
  "epargne",
  "assurance",
  "retrait",
  "dette",
  "investissement",
  "autre",

  // mêmes valeurs que dans le modèle
  "loyer",
  "alimentation",
  "transport",
  "sante",
  "education",
  "loisirs",
  "impots_taxes",
  "abonnement",
  "frais_bancaires",
  "cadeaux_dons",
  "entretien_reparation",
  "achat_materiel",
  "frais_service",
  "voyage_deplacement",
  "frais_professionnels",
]);

const TYPES = new Set(["income", "expense"]);
const RECS = new Set(["fixe", "mensuel"]);

/* auth */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      console.warn(`[FIN ${req._rid}] AUTH FAIL headers=${short(req.headers)}`);
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch (e) {
    console.warn(`[FIN ${req._rid}] AUTH EXC ${e?.message || e}`);
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ================== PREFS (devise globale) ================== */
router.get("/prefs", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const pref = await FinancePref.findOne({ user: req.auth.userId }).lean();
    return res.status(200).json({
      ok: true,
      data: {
        globalCurrency: pref?.globalCurrency || "XOF",
      },
    });
  } catch (e) {
    console.error(`[FIN ${rid}] PREFS GET ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Prefs indisponibles" });
  }
});

router.patch("/prefs", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const body = req.body || {};
    const raw = clampStr(body.globalCurrency || "", 8).toUpperCase();
    const finalCur = CURRENCIES.has(raw) ? raw : "XOF";
    const pref = await FinancePref.findOneAndUpdate(
      { user: req.auth.userId },
      { $set: { globalCurrency: finalCur } },
      { new: true, upsert: true }
    ).lean();
    return res.status(200).json({
      ok: true,
      data: { globalCurrency: pref.globalCurrency },
    });
  } catch (e) {
    console.error(`[FIN ${rid}] PREFS PATCH ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ===== Materialize mensuel (exclut futur) ===== */
function ym(d) {
  return new Date(d).toISOString().slice(0, 7);
}

function materializeMonthlyServer(list) {
  // borne = fin de journée (évite de générer du futur)
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);

  // on garde uniquement <= aujourd’hui
  const out = list
    .filter((t) => new Date(t.date).getTime() <= endToday.getTime())
    .map((t) => ({ ...t }));

  // évite les doublons (parentId + YYYY-MM)
  const seen = new Set(
    out
      .filter((t) => t.parentId)
      .map((t) => `${String(t.parentId)}:${ym(t.date)}`)
  );

  for (const t of list) {
    if (t.recurrence !== "mensuel" || t.parentId) continue;

    const start = new Date(t.date);
    if (start > endToday) continue;

    const months =
      (endToday.getFullYear() - start.getFullYear()) * 12 +
      (endToday.getMonth() - start.getMonth());

    for (let m = 1; m <= months; m++) {
      const occ = new Date(start);
      occ.setMonth(start.getMonth() + m);

      const key = `${String(t._id)}:${ym(occ)}`;
      if (seen.has(key)) continue;

      const day = String(start.getDate()).padStart(2, "0");
      const iso = new Date(`${ym(occ)}-${day}T00:00:00Z`);
      if (iso > endToday) continue;

      out.push({
        ...t,
        _id: undefined, // occurrence matérialisée
        parentId: t._id, // lien vers l’origine
        date: iso,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
      seen.add(key);
    }
  }
  return out;
}

/* ================= ACCOUNTS ================= */
router.get("/accounts", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    console.log(
      `[FIN ${rid}] GET /finance/accounts q=${req.query.q || ""} cursor=${
        req.query.cursor || ""
      }`
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

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { description: re }];
    }

    const rows = await Account.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const payload = items.map((a) => ({
      id: String(a._id),
      name: a.name || "Sans nom",
      currency: a.currency || "XOF",
      initial: Number(a.initial) || 0,
      description: a.description || "",
      createdAt: toISO(a.createdAt),
      updatedAt: toISO(a.updatedAt),
    }));

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? String(new Date(last.updatedAt).getTime()) : null;

    console.log(
      `[FIN ${rid}] ACCOUNTS OK count=${payload.length} next=${nextCursor} (${
        Date.now() - req._t0
      }ms)`
    );
    return res
      .status(200)
      .json({ ok: true, data: { items: payload, nextCursor } });
  } catch (e) {
    console.error(`[FIN ${rid}] ACCOUNTS ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.get("/accounts/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const a = await Account.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!a)
      return res.status(404).json({ ok: false, error: "Compte introuvable" });
    const out = {
      ok: true,
      data: {
        account: {
          id: String(a._id),
          name: a.name || "Sans nom",
          currency: a.currency || "XOF",
          initial: Number(a.initial) || 0,
          description: a.description || "",
          createdAt: toISO(a.createdAt),
          updatedAt: toISO(a.updatedAt),
        },
      },
    };
    return res.status(200).json(out);
  } catch (e) {
    console.error(`[FIN ${rid}] ACCOUNT one ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.post("/accounts", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const b = req.body || {};
    const name = clampStr(b.name || "Sans nom", 160);
    const rawCur = clampStr(b.currency || "", 8).toUpperCase();
    const currency = CURRENCIES.has(rawCur) ? rawCur : "XOF";
    const initial = Number(b.initial) || 0;
    const description = clampStr(b.description || "", 2000);
    const acc = await Account.create({
      user: req.auth.userId,
      name,
      currency,
      initial,
      description,
    });
    return res.status(201).json({
      ok: true,
      data: { id: String(acc._id), updatedAt: toISO(acc.updatedAt) },
    });
  } catch (e) {
    console.error(`[FIN ${rid}] ACCOUNT create ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

router.patch("/accounts/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const acc = await Account.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!acc)
      return res.status(404).json({ ok: false, error: "Compte introuvable" });
    const b = req.body || {};
    if (b.name !== undefined) acc.name = clampStr(b.name, 160) || "Sans nom";
    if (b.currency !== undefined) {
      const raw = clampStr(b.currency, 8).toUpperCase();
      if (CURRENCIES.has(raw)) acc.currency = raw;
    }
    if (b.initial !== undefined) acc.initial = Number(b.initial) || 0;
    if (b.description !== undefined)
      acc.description = clampStr(b.description, 2000);
    await acc.save();
    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(acc.updatedAt) } });
  } catch (e) {
    console.error(`[FIN ${rid}] ACCOUNT patch ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

router.delete("/accounts/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const acc = await Account.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!acc)
      return res.status(404).json({ ok: false, error: "Compte introuvable" });
    acc.deletedAt = new Date();
    await acc.save();
    await Tx.updateMany(
      { user: req.auth.userId, account: acc._id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(`[FIN ${rid}] ACCOUNT delete ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ================= TRANSACTIONS ================= */
router.get("/transactions", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "50", 10), 1),
      200
    );
    const cursorRaw = req.query.cursor;
    const cursor = cursorRaw
      ? new Date(Number(cursorRaw) || cursorRaw)
      : new Date();

    const filter = {
      user: userId,
      deletedAt: null,
      updatedAt: { $lt: cursor },
    };

    if (req.query.accountId) filter.account = req.query.accountId;
    if (req.query.type && TYPES.has(req.query.type))
      filter.type = req.query.type;
    if (req.query.detail && DETAILS.has(req.query.detail))
      filter.detail = req.query.detail;
    if (req.query.recurrence && RECS.has(req.query.recurrence))
      filter.recurrence = req.query.recurrence;

    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (from || to) filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;

    const q = clampStr(req.query.q, 160);
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ comment: re }, { detail: re }];
    }

    const rows = await Tx.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const materialize =
      req.query.materialize == null ? true : parseBool(req.query.materialize);
    const processed = materialize ? materializeMonthlyServer(rows) : rows;

    const items = rows.length > limit ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      rows.length > limit && last
        ? String(new Date(last.updatedAt).getTime())
        : null;

    const payload = processed.map((t) => ({
      id: String(
        t._id ??
          t.id ??
          t._id?.toString?.() ??
          Math.random().toString(36).slice(2)
      ),
      accountId: String(t.account),
      type: t.type,
      amount: Number(t.amount) || 0,
      date: toISO(t.date),
      recurrence: t.recurrence || "fixe",
      detail: t.detail || "autre",
      comment: t.comment || "",
      createdAt: toISO(t.createdAt),
      updatedAt: toISO(t.updatedAt),
      parentId: t.parentId ? String(t.parentId) : undefined,
    }));

    return res
      .status(200)
      .json({ ok: true, data: { items: payload, nextCursor } });
  } catch (e) {
    console.error(`[FIN ${rid}] TX list ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.get("/transactions/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const t = await Tx.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!t)
      return res
        .status(404)
        .json({ ok: false, error: "Transaction introuvable" });
    const out = {
      ok: true,
      data: {
        tx: {
          id: String(t._id),
          accountId: String(t.account),
          type: t.type,
          amount: Number(t.amount) || 0,
          date: toISO(t.date),
          recurrence: t.recurrence || "fixe",
          detail: t.detail || "autre",
          comment: t.comment || "",
          createdAt: toISO(t.createdAt),
          updatedAt: toISO(t.updatedAt),
          parentId: t.parentId ? String(t.parentId) : undefined,
        },
      },
    };
    return res.status(200).json(out);
  } catch (e) {
    console.error(`[FIN ${rid}] TX one ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

router.post("/transactions", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const b = req.body || {};
    const accountId = String(b.accountId || b.account || "");
    if (!accountId)
      return res.status(400).json({ ok: false, error: "accountId requis" });

    const acc = await Account.findOne({
      _id: accountId,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!acc)
      return res.status(404).json({ ok: false, error: "Compte introuvable" });

    const type = TYPES.has(b.type) ? b.type : "expense";
    const amount = Math.abs(Number(b.amount) || 0);
    const date = b.date ? new Date(b.date) : new Date();
    const recurrence = RECS.has(b.recurrence) ? b.recurrence : "fixe";
    const detail = DETAILS.has(b.detail) ? b.detail : "autre";
    const comment = clampStr(b.comment || "", 2000);

    const tx = await Tx.create({
      user: req.auth.userId,
      account: acc._id,
      type,
      amount,
      date,
      recurrence,
      detail,
      comment,
      parentId: null,
    });

    return res.status(201).json({
      ok: true,
      data: { id: String(tx._id), updatedAt: toISO(tx.updatedAt) },
    });
  } catch (e) {
    console.error(`[FIN ${rid}] TX create ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

router.patch("/transactions/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const tx = await Tx.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!tx)
      return res
        .status(404)
        .json({ ok: false, error: "Transaction introuvable" });
    const b = req.body || {};
    if (b.accountId) {
      const acc = await Account.findOne({
        _id: b.accountId,
        user: req.auth.userId,
        deletedAt: null,
      }).lean();
      if (!acc)
        return res.status(404).json({ ok: false, error: "Compte introuvable" });
      tx.account = acc._id;
    }
    if (b.type && TYPES.has(b.type)) tx.type = b.type;
    if (b.amount !== undefined) tx.amount = Math.abs(Number(b.amount) || 0);
    if (b.date !== undefined) tx.date = new Date(b.date);
    if (b.recurrence && RECS.has(b.recurrence)) tx.recurrence = b.recurrence;
    if (b.detail && DETAILS.has(b.detail)) tx.detail = b.detail;
    if (b.comment !== undefined) tx.comment = clampStr(b.comment, 2000);
    await tx.save();
    return res
      .status(200)
      .json({ ok: true, data: { updatedAt: toISO(tx.updatedAt) } });
  } catch (e) {
    console.error(`[FIN ${rid}] TX patch ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

router.delete("/transactions/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const tx = await Tx.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!tx)
      return res
        .status(404)
        .json({ ok: false, error: "Transaction introuvable" });
    tx.deletedAt = new Date();
    await tx.save();
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(`[FIN ${rid}] TX delete ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ================= STATS SUMMARY ================= */
router.get("/stats/summary", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = req.auth.userId;
    const accountId = req.query.accountId || null;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const materialize =
      req.query.materialize == null ? true : parseBool(req.query.materialize);

    const accFilter = { user: userId, deletedAt: null };
    if (accountId) accFilter._id = accountId;
    const accounts = await Account.find(accFilter).lean();

    const txFilter = { user: userId, deletedAt: null };
    if (accountId) txFilter.account = accountId;
    if (from || to) txFilter.date = {};
    if (from) txFilter.date.$gte = from;
    if (to) txFilter.date.$lte = to;
    const txsRaw = await Tx.find(txFilter).lean();
    const txs = materialize ? materializeMonthlyServer(txsRaw) : txsRaw;

    const initial = accounts.reduce((s, a) => s + (Number(a.initial) || 0), 0);
    let income = 0,
      expense = 0;
    for (const t of txs) {
      const a = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") income += a;
      else expense += a;
    }
    const balance = initial + income - expense;

    const per = new Map();
    for (const t of txs) {
      const id = String(t.account);
      const cur = per.get(id) || { income: 0, expense: 0 };
      const a = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") cur.income += a;
      else cur.expense += a;
      per.set(id, cur);
    }
    const perAccount = accounts.map((a) => {
      const s = per.get(String(a._id)) || { income: 0, expense: 0 };
      return {
        id: String(a._id),
        name: a.name || "Sans nom",
        currency: a.currency || "XOF",
        income: s.income,
        expense: s.expense,
        balance: (Number(a.initial) || 0) + s.income - s.expense,
      };
    });

    const byYM = new Map();
    for (const t of txs) {
      const k = ym(t.date);
      const row = byYM.get(k) || { ym: k, income: 0, expense: 0 };
      const a = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") row.income += a;
      else row.expense += a;
      byYM.set(k, row);
    }
    const monthly = Array.from(byYM.values())
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .map((r) => ({
        ym: r.ym,
        income: r.income,
        expense: r.expense,
        net: r.income - r.expense,
      }));

    return res.status(200).json({
      ok: true,
      data: { initial, income, expense, balance, perAccount, monthly },
    });
  } catch (e) {
    console.error(`[FIN ${rid}] STATS ERROR: ${e?.stack || e}`);
    return res
      .status(500)
      .json({ ok: false, error: "Statistiques indisponibles" });
  }
});

module.exports = router;
