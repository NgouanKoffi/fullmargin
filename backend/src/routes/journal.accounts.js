// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\journal.accounts.js
const express = require("express");
const JournalAccount = require("../models/journalAccount.model");
const {
  makeCrudRouter,
  clampStr,
  toISO,
  requireAuth,
} = require("./_crudFactory");

// normalisation côté routeur (cohérent avec le modèle)
const {
  SERVER_FIAT_CODES,
  normalizeCurrencyModel,
} = require("../models/journalAccount.model");

// on garde ta fonction de normalisation côté route (pareil que modèle)
const normalizeCurrency = (c) => {
  const v = String(c || "")
    .toUpperCase()
    .trim();
  if (v === "FCFA") return "XOF";
  if (v === "FCFA_BEAC") return "XAF";
  return SERVER_FIAT_CODES.includes(v) ? v : "USD";
};

const router = express.Router();

/** PATCH /journal/accounts/set-currency
 *  Met à jour la devise de TOUS les comptes (sans conversion)
 *  ⚠️ doit être déclarée AVANT le CRUD généré, sinon /:id la mange
 */
router.patch("/set-currency", requireAuth, async (req, res, next) => {
  try {
    const currency = normalizeCurrency(req.body?.currency);
    const user = req.auth?.userId;
    if (!user)
      return res.status(401).json({ ok: false, error: "Unauthenticated" });

    const r = await JournalAccount.updateMany(
      { user, deletedAt: null },
      { $set: { currency } }
    );
    return res.json({
      ok: true,
      data: { updated: r.modifiedCount || r.matchedCount || 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * puis on branche le CRUD classique sur "/"
 * (LIST, CREATE, PATCH /:id, DELETE /:id)
 */
const crudRouter = makeCrudRouter(JournalAccount, {
  name: "JACCOUNTS",
  searchFields: ["name", "currency", "description"],

  pickCreate: (b) => ({
    name: clampStr(b.name, 160) || "Sans nom",
    currency: normalizeCurrency(b.currency),
    initial: Number.isFinite(Number(b.initial)) ? Number(b.initial) : 0,
    description: clampStr(b.description, 2000),
  }),

  pickUpdate: (b, doc) => {
    if (b.name !== undefined) doc.name = clampStr(b.name, 160) || "Sans nom";
    if (b.currency !== undefined) doc.currency = normalizeCurrency(b.currency);
    if (b.initial !== undefined)
      doc.initial = Number.isFinite(Number(b.initial))
        ? Number(b.initial)
        : doc.initial;
    if (b.description !== undefined)
      doc.description = clampStr(b.description, 2000);
  },

  serialize: (a) => ({
    id: String(a._id),
    name: String(a.name || "Sans nom"),
    currency: normalizeCurrency(a.currency || "USD"),
    initial: Number(a.initial) || 0,
    description: String(a.description || ""),
    createdAt: toISO(a.createdAt),
    updatedAt: toISO(a.updatedAt),
  }),

  // ✅ Clear accountId and accountName from journal entries when account is deleted
  onDelete: async (deletedAccount, userId) => {
    const JournalEntry = require("../models/journalEntry.model");
    const result = await JournalEntry.updateMany(
      { user: userId, accountId: String(deletedAccount._id) },
      { $set: { accountId: "", accountName: "" } }
    );
    console.log(
      `[JACCOUNTS] Cleared accountId from ${result.modifiedCount || 0} journal entries`
    );
  },
});

router.use("/", crudRouter);

module.exports = router;
