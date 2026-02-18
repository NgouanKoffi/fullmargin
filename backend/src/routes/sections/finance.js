// backend/src/routes/sections/finance.js
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Withdrawal = require("../../models/withdrawal.model");
const User = require("../../models/user.model");
const SellerPayout = require("../../models/sellerPayout.model");
const CoursePayout = require("../../models/coursePayout.model");
const AffiliationCommission = require("../../models/affiliationCommission.model");
const { requireAuth } = require("../../middlewares/auth");
const { createNotif } = require("../../utils/notifications");

/* ===== UTILITAIRES ===== */
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};
const money = (val) => Number(Number(val || 0).toFixed(2));
const generateReference = () =>
  `W-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

const MIN_WITHDRAW_AMOUNT = 20;
const COMMISSION_RATE = 0.09;

/** * 🛠 LOGIQUE DE SYNCHRONISATION "JUSTE-À-TEMPS"
 * Calcule le solde réel basé sur l'historique avant de traiter le retrait
 */
async function syncUserBalanceBeforeWithdraw(userId) {
  // Convert userId to ObjectId for aggregation
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // 1. Boutique (SellerPayout)
  const mk = await SellerPayout.aggregate([
    { $match: { seller: userObjectId, status: { $in: ["available", "ready"] } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);

  // 2. Cours / Communauté (CoursePayout)
  const cp = await CoursePayout.aggregate([
    { $match: { seller: userObjectId, status: { $in: ["available", "ready"] } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);

  // 3. Affiliation (Commission - On divise par 100 car souvent stocké en cents)
  const af = await AffiliationCommission.aggregate([
    { $match: { referrerId: userObjectId, status: { $ne: "cancelled" } } },
    { $group: { _id: null, totalCents: { $sum: "$amount" } } },
  ]);

  const balances = {
    sellerBalance: money(mk[0]?.total || 0),
    communityBalance: money(cp[0]?.total || 0),
    affiliationBalance: money((af[0]?.totalCents || 0) / 100),
  };

  // Mise à jour du document User
  await User.updateOne({ _id: userId }, { $set: balances });

  return balances;
}

/* ===== ADMIN GUARD ===== */
async function requireAdminOrAgent(req, res, next) {
  try {
    const userId = req?.auth?.userId;
    if (!userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    const me = await User.findById(userId).select("roles").lean();
    if (!me?.roles?.includes("admin") && !me?.roles?.includes("agent"))
      return res.status(403).json({ ok: false, error: "Accès refusé" });
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ===== RESTORE FUNDS ===== */
async function restoreFunds(withdrawalId, note, actorId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const w = await Withdrawal.findById(withdrawalId).session(session);
    if (!w || w.restoredAt) {
      await session.commitTransaction();
      return { ok: true };
    }

    const snap = w.balancesSnapshot || {};
    await User.updateOne(
      { _id: w.user },
      {
        $inc: {
          sellerBalance: Number(snap.seller || 0),
          communityBalance: Number(snap.community || 0),
          affiliationBalance: Number(snap.affiliation || 0),
        },
      },
      { session },
    );

    await Withdrawal.updateOne(
      { _id: w._id },
      {
        $set: {
          restoredAt: new Date(),
          restoredBy: actorId,
          adminNote: note,
          processedAt: new Date(),
        },
      },
      { session },
    );
    await session.commitTransaction();
    return { ok: true };
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {}
    return { ok: false };
  } finally {
    session.endSession();
  }
}

module.exports = (router) => {
  /* POST /wallet/withdrawals - Création demande avec SYNC AUTO */
  router.post("/wallet/withdrawals", requireAuth, async (req, res) => {
    const rid = req._rid || crypto.randomUUID();
    try {
      const userId = req.auth.userId;
      const b = req.body || {};

      // 1. SYNCHRONISATION DE SÉCURITÉ (Ta nouvelle idée)
      // On répare le compte juste avant de vérifier le solde
      const syncedBalances = await syncUserBalanceBeforeWithdraw(userId);

      const method = String(b.method || "")
        .trim()
        .toUpperCase();
      if (!["USDT", "BTC", "BANK"].includes(method))
        return res.status(400).json({ ok: false, error: "Méthode invalide" });

      const details = b.paymentDetails || {};
      const paymentDetails = {
        cryptoAddress: clampStr(details.cryptoAddress, 200),
        bankName: clampStr(details.bankName, 100),
        bankIban: clampStr(details.bankIban, 50),
        bankSwift: clampStr(details.bankSwift, 20),
        bankCountry: clampStr(details.bankCountry, 50),
      };

      // Anti-doublon
      const active = await Withdrawal.findOne({
        user: userId,
        status: { $in: ["PENDING", "VALIDATED"] },
      }).lean();
      if (active)
        return res
          .status(400)
          .json({ ok: false, error: "Un retrait est déjà en cours." });

      const total = money(
        syncedBalances.sellerBalance +
          syncedBalances.communityBalance +
          syncedBalances.affiliationBalance,
      );

      if (total < MIN_WITHDRAW_AMOUNT) {
        return res
          .status(400)
          .json({
            ok: false,
            error: `Solde insuffisant (${total}$, min ${MIN_WITHDRAW_AMOUNT}$)`,
          });
      }

      const taxable =
        syncedBalances.sellerBalance + syncedBalances.communityBalance;
      const comm = money(taxable * COMMISSION_RATE);
      const net = money(total - comm);

      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const w = await Withdrawal.create(
          [
            {
              user: userId,
              reference: generateReference(),
              amountGross: total,
              commission: comm,
              amountNet: net,
              method,
              paymentDetails,
              status: "PENDING",
              balancesSnapshot: {
                seller: syncedBalances.sellerBalance,
                community: syncedBalances.communityBalance,
                affiliation: syncedBalances.affiliationBalance,
              },
              restoredAt: null,
              processedAt: null,
            },
          ],
          { session },
        );

        // Vider le solde après création du retrait
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              sellerBalance: 0,
              communityBalance: 0,
              affiliationBalance: 0,
            },
          },
          { session },
        );

        // ✅ IMPORTANT: Marquer les payouts comme "withdrawn" pour que le frontend ne les compte plus
        await SellerPayout.updateMany(
          { seller: userId, status: { $in: ["available", "ready"] } },
          { $set: { status: "withdrawn" } },
          { session }
        );

        await CoursePayout.updateMany(
          { seller: userId, status: { $in: ["available", "ready"] } },
          { $set: { status: "withdrawn" } },
          { session }
        );

        await AffiliationCommission.updateMany(
          { referrerId: userId, status: { $ne: "cancelled" } },
          { $set: { status: "withdrawn" } },
          { session }
        );

        await session.commitTransaction();

        // 🔔 Notification: demande de retrait créée
        await createNotif({
          userId,
          kind: "finance_withdrawal_requested",
          payload: {
            withdrawalId: String(w[0]._id),
            reference: w[0].reference,
            amount: net,
            message: `Votre demande de retrait de ${net}$ a été créée avec succès.`,
          },
        });

        return res
          .status(201)
          .json({
            ok: true,
            data: { id: String(w[0]._id), status: "PENDING" },
          });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } catch (e) {
      console.error(`[WITHDRAW ERROR ${rid}]`, e);
      return res
        .status(500)
        .json({ ok: false, error: e.message || "Erreur serveur" });
    }
  });

  /* GET /wallet/withdrawals - Historique */
  router.get("/wallet/withdrawals", requireAuth, async (req, res) => {
    try {
      const rows = await Withdrawal.find({ user: req.auth.userId })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({
        ok: true,
        data: rows.map((w) => ({
          id: String(w._id),
          reference: w.reference,
          date: toISO(w.createdAt),
          amount: w.amountNet,
          method: w.method,
          status: w.status,
          details:
            w.method === "BANK"
              ? w.paymentDetails?.bankIban
              : w.paymentDetails?.cryptoAddress,
          rejectionReason: w.rejectionReason,
          payoutRef: w.payoutRef,
          proof: w.proof || null,
        })),
      });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });

  require("./admin.withdrawals")(router);
};
