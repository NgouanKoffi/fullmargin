// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\journal.bootstrap.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("./_crudFactory");
const Market = require("../models/market.model");
const Strategy = require("../models/strategy.model");
const JournalAccount = require("../models/journalAccount.model");
// 1. Import du nouveau modèle
const AccountTransaction = require("../models/accountTransaction.model");

const toISO = (d) => {
  try {
    return new Date(d).toISOString();
  } catch {
    return "";
  }
};

router.get("/", requireAuth, async (req, res) => {
  const t0 = Date.now();
  try {
    const userId = req.auth.userId;
    // 2. On ajoute 'transactions' à la déstructuration
    const [markets, strategies, accounts, transactions] = await Promise.all([
      Market.find({ user: userId, deletedAt: null }).sort({ name: 1 }).lean(),
      Strategy.find({ user: userId, deletedAt: null }).sort({ name: 1 }).lean(),
      JournalAccount.find({ user: userId, deletedAt: null })
        .sort({ name: 1 })
        .lean(),
      // 3. On fetch les transactions du compte de l'utilisateur
      AccountTransaction.find({ user: userId, deletedAt: null })
        .sort({ date: 1 })
        .lean(),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        markets: markets.map((m) => ({
          id: String(m._id),
          name: m.name || "",
          updatedAt: toISO(m.updatedAt),
        })),
        strategies: strategies.map((s) => ({
          id: String(s._id),
          name: s.name || "",
          updatedAt: toISO(s.updatedAt),
        })),
        accounts: accounts.map((a) => ({
          id: String(a._id),
          name: a.name || "Sans nom",
          currency:
            String(a.currency || "XOF").toUpperCase() === "FCFA"
              ? "XOF"
              : a.currency || "XOF",
          initial: Number(a.initial) || 0,
          description: a.description || "",
          updatedAt: toISO(a.updatedAt),
        })),
        // 4. On mappe les transactions pour les renvoyer au front
        transactions: transactions.map((t) => ({
          id: String(t._id),
          accountId: String(t.accountId),
          type: t.type,
          amount: Number(t.amount) || 0,
          date: t.date,
          note: t.note || "",
        })),
      },
    });
  } catch (e) {
    console.error(`[BOOTSTRAP] ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Bootstrap impossible" });
  } finally {
    console.log(`[BOOTSTRAP] ${Date.now() - t0}ms`);
  }
});

module.exports = router;