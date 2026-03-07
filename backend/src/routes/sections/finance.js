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

// ✅ SEUIL MIS À JOUR (100 USD)
const MIN_WITHDRAW_AMOUNT = 100;
const COMMISSION_RATE = 0.09;

/**
 * 🛠 LOGIQUE DE SYNCHRONISATION "JUSTE-À-TEMPS"
 * Calcule le solde réel basé sur l'historique avant de traiter le retrait
 */
async function syncUserBalanceBeforeWithdraw(userId) {
  const userIdStr = String(userId);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  // Match bétonné pour éviter les erreurs de type (String vs ObjectId) en base
  const userMatch = { $in: [userObjectId, userIdStr] };

  // 1. Boutique
  const mk = await SellerPayout.aggregate([
    { $match: { seller: userMatch, status: { $in: ["available", "ready"] } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);

  // 2. Cours
  const cp = await CoursePayout.aggregate([
    { $match: { seller: userMatch, status: { $in: ["available", "ready"] } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);

  // 3. Affiliation (On prend tout ce qui n'est pas déjà retiré ou annulé)
  const af = await AffiliationCommission.aggregate([
    {
      $match: {
        referrerId: userMatch,
        status: { $nin: ["withdrawn", "cancelled", "pending_withdrawal"] },
      },
    },
    { $group: { _id: null, totalCents: { $sum: "$amount" } } },
  ]);

  const balances = {
    sellerBalance: money(mk[0]?.total || 0),
    communityBalance: money(cp[0]?.total || 0),
    affiliationBalance: money((af[0]?.totalCents || 0) / 100),
  };

  // Mise à jour de l'affichage sur le profil
  await User.updateOne({ _id: userObjectId }, { $set: balances });
  return balances;
}

module.exports = (router) => {
  /* POST /wallet/withdrawals - Création demande avec SYNC AUTO */
  router.post("/wallet/withdrawals", requireAuth, async (req, res) => {
    const rid = req._rid || crypto.randomUUID();
    try {
      const userId = req.auth.userId;
      const b = req.body || {};

      const syncedBalances = await syncUserBalanceBeforeWithdraw(userId);

      const method = String(b.method || "")
        .trim()
        .toUpperCase();
      if (!["USDT", "BTC", "BANK"].includes(method))
        return res.status(400).json({ ok: false, error: "Méthode invalide" });

      const paymentDetails = {
        cryptoAddress: clampStr(b.paymentDetails?.cryptoAddress, 200),
        bankName: clampStr(b.paymentDetails?.bankName, 100),
        bankIban: clampStr(b.paymentDetails?.bankIban, 50),
        bankSwift: clampStr(b.paymentDetails?.bankSwift, 20),
        bankCountry: clampStr(b.paymentDetails?.bankCountry, 50),
      };

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
        return res.status(400).json({
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
            },
          ],
          { session },
        );

        // On remet l'affichage du User à 0
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

        const userIdStr = String(userId);
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userMatch = { $in: [userObjectId, userIdStr] };

        // ✅ ON VERROUILLE L'ARGENT : Les factures passent en "pending_withdrawal"
        await SellerPayout.updateMany(
          { seller: userMatch, status: { $in: ["available", "ready"] } },
          { $set: { status: "pending_withdrawal" } },
          { session },
        );

        await CoursePayout.updateMany(
          { seller: userMatch, status: { $in: ["available", "ready"] } },
          { $set: { status: "pending_withdrawal" } },
          { session },
        );

        // ✅ L'Affiliation est correctement verrouillée aussi
        await AffiliationCommission.updateMany(
          {
            referrerId: userMatch,
            status: { $nin: ["withdrawn", "cancelled", "pending_withdrawal"] },
          },
          { $set: { status: "pending_withdrawal" } },
          { session },
        );

        await session.commitTransaction();

        // 🔔 Notif User
        await createNotif({
          userId,
          kind: "finance_withdrawal_requested",
          payload: {
            withdrawalId: String(w[0]._id),
            reference: w[0].reference,
            amount: net,
            message: `Votre demande de retrait de ${net}$ a été créée avec succès.`,
          },
        }).catch(() => {});

        // 🔔 Notif Admins
        try {
          const requester = await User.findById(userId)
            .select("name profile email")
            .lean();
          const requesterName =
            requester?.profile?.fullName ||
            requester?.name ||
            requester?.email ||
            "Un utilisateur";
          const admins = await User.find({ roles: "admin" })
            .select("_id")
            .lean();
          const adminPromises = admins.map((admin) =>
            createNotif({
              userId: String(admin._id),
              kind: "admin_withdrawal_pending",
              payload: {
                userName: requesterName,
                amount: `${net} USD`,
                withdrawalId: String(w[0]._id),
                message: `${requesterName} demande un retrait de ${net} USD.`,
              },
            }),
          );
          await Promise.allSettled(adminPromises);
        } catch (e) {
          console.error("Notif admin fail:", e);
        }

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
          paymentDetails: w.paymentDetails || {},
          rejectionReason: w.rejectionReason,
          failureReason: w.failureReason,
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
