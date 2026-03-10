// GET /api/marketplace/profile/balance
const express = require("express");
const router = express.Router();

const SellerPayout = require("../../models/sellerPayout.model");
const { verifyAuthHeader } = require("../auth/_helpers");

/** Auth helper */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/**
 * Ce endpoint agrège les payouts du vendeur connecté.
 * - available: fonds “prêts à être retirés” (ex: status='ready')
 * - pending: fonds en cours de déblocage (ex: status='pending')
 * - paid: total déjà versé (ex: status='paid')
 * - lifetimeNet: total net cumulé toutes périodes (paid + ready + pending)
 * - community: 0 pour le moment (placeholder)
 *
 * ⚠️ Robuste aux schémas variés : si pas de `status`, on déduit via paidAt.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.auth.userId);

    // Récupère tous les payouts du vendeur (on reste “no-store” côté client)
    const payouts = await SellerPayout.find({ seller: userId })
      .select("currency netAmount status paidAt")
      .lean();

    let currency = "USD";
    let available = 0;
    let pending = 0;
    let paid = 0;

    for (const p of payouts) {
      const net = Number(p.netAmount || 0);
      if (p.currency) currency = String(p.currency).toUpperCase();

      // Si status existe, on l’utilise. Sinon fallback: paidAt => paid, sinon pending.
      const st = (p.status || "").toLowerCase();
      if (st) {
        if (st === "ready" || st === "available") available += net;
        else if (st === "pending" || st === "processing") pending += net;
        else if (st === "paid" || st === "succeeded" || st === "completed")
          paid += net;
        else pending += net; // inconnu => on joue safe
      } else {
        if (p.paidAt) paid += net;
        else pending += net;
      }
    }

    const lifetimeNet = available + pending + paid;

    // TODO: brancher quand la communauté sera calculée
    const community = 0;

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      data: {
        currency,
        available,
        pending,
        paid,
        lifetimeNet,
        community,
      },
    });
  } catch (e) {
    console.error("[profile.balance] error:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible de charger le solde" });
  }
});

module.exports = router;
