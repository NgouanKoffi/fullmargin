// backend/src/routes/journal.transactions.js
const express = require("express");
const AccountTransaction = require("../models/accountTransaction.model");
const { requireAuth, clampStr, toISO } = require("./_crudFactory");

const router = express.Router();

// --- AJOUTER UNE TRANSACTION (Dépôt ou Retrait) ---
router.post("/", requireAuth, async (req, res) => {
  try {
    const { accountId, type, amount, date, note } = req.body;
    
    // Vérification de base
    if (!accountId || !["deposit", "withdrawal"].includes(type) || !amount || !date) {
      return res.status(400).json({ ok: false, error: "Champs manquants ou invalides" });
    }

    const tx = new AccountTransaction({
      user: req.auth.userId,
      accountId: String(accountId),
      type,
      amount: Number(amount),
      date: String(date).slice(0, 10),
      note: clampStr(note || "", 500)
    });

    await tx.save();

    return res.status(200).json({
      ok: true,
      data: {
        id: String(tx._id),
        accountId: tx.accountId,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        note: tx.note,
        createdAt: toISO(tx.createdAt)
      }
    });
  } catch (err) {
    console.error("Erreur POST /journal/transactions:", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// --- SUPPRIMER UNE TRANSACTION (Soft delete) ---
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const tx = await AccountTransaction.findOne({ 
      _id: req.params.id, 
      user: req.auth.userId,
      deletedAt: null
    });

    if (!tx) {
      return res.status(404).json({ ok: false, error: "Transaction introuvable" });
    }

    tx.deletedAt = new Date();
    await tx.save();

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// --- RÉCUPÉRER TOUTES LES TRANSACTIONS ---
router.get("/", requireAuth, async (req, res) => {
  try {
    const txs = await AccountTransaction.find({ 
      user: req.auth.userId, 
      deletedAt: null 
    }).lean();

    return res.status(200).json({
      ok: true,
      data: {
        items: txs.map(t => ({
          id: String(t._id),
          accountId: t.accountId,
          type: t.type,
          amount: t.amount,
          date: t.date,
          note: t.note
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;