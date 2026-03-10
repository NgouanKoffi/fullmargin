// backend/src/routes/sections/admin.withdrawals.js
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Withdrawal = require("../../models/withdrawal.model");
const User = require("../../models/user.model");
const SellerPayout = require("../../models/sellerPayout.model");
const CoursePayout = require("../../models/coursePayout.model");
const AffiliationCommission = require("../../models/affiliationCommission.model");
const { requireAuth } = require("../../middlewares/auth");
const { createNotif } = require("../../utils/notifications");

const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const money = (val) => Number(Number(val || 0).toFixed(2));
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};

async function requireAdminOrAgent(req, res, next) {
  try {
    const me = await User.findById(req.auth.userId).select("roles email name");
    if (!me) return res.status(401).json({ ok: false, error: "Non autorisé" });
    const roles = me.roles || [];
    if (!roles.includes("admin") && !roles.includes("agent")) {
      return res.status(403).json({ ok: false, error: "Accès refusé" });
    }
    req._adminUser = me;
    next();
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Erreur auth admin" });
  }
}

function pickUserName(u) {
  if (!u) return "—";
  if (u.name) return u.name;
  const fn = u.firstName || "";
  const ln = u.lastName || "";
  const full = `${fn} ${ln}`.trim();
  return full || u.email || "—";
}

module.exports = (router) => {
  // =========================================================================
  // LIST
  // =========================================================================
  router.get(
    "/admin/withdrawals",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      const rid = req._rid || crypto.randomUUID();
      try {
        const status = String(req.query.status || "")
          .trim()
          .toUpperCase();
        const q = String(req.query.q || "").trim();

        const filter = {};
        if (
          ["PENDING", "VALIDATED", "PAID", "REJECTED", "FAILED"].includes(
            status,
          )
        ) {
          filter.status = status;
        }

        let userIds = [];
        let refRegex = null;

        if (q) {
          refRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          const users = await User.find({
            $or: [
              { email: refRegex },
              { name: refRegex },
              { firstName: refRegex },
              { lastName: refRegex },
            ],
          }).select("_id");
          userIds = users.map((x) => x._id);
        }

        if (q) {
          filter.$or = [
            { reference: refRegex },
            ...(userIds.length ? [{ user: { $in: userIds } }] : []),
          ];
        }

        const rows = await Withdrawal.find(filter)
          .sort({ createdAt: -1 })
          .limit(200)
          .populate("user", "email name firstName lastName")
          .lean();

        const items = rows.map((w) => ({
          id: String(w._id),
          reference: w.reference,
          currency: "USD",
          amountGross: w.amountGross,
          commission: w.commission,
          amountNet: w.amountNet,
          method: w.method,
          status: w.status,
          createdAt: toISO(w.createdAt),
          user: w.user
            ? {
                id: String(w.user._id),
                email: w.user.email || "",
                name: pickUserName(w.user),
              }
            : null,
          paymentDetails: w.paymentDetails || {},
          rejectionReason: w.rejectionReason || undefined,
          failureReason: w.failureReason || undefined,
          payoutRef: w.payoutRef || undefined,
          proof: w.proof || undefined,
        }));

        return res.json({ ok: true, data: { items } });
      } catch (e) {
        console.error(`[ADMIN WITHDRAWALS ${rid}]`, e?.stack || e);
        return res
          .status(500)
          .json({ ok: false, error: "Erreur liste retraits" });
      }
    },
  );

  // =========================================================================
  // VALIDATE: PENDING -> VALIDATED
  // =========================================================================
  router.post(
    "/admin/withdrawals/:id/validate",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      try {
        const w = await Withdrawal.findById(req.params.id);
        if (!w)
          return res
            .status(404)
            .json({ ok: false, error: "Retrait introuvable" });
        if (w.status !== "PENDING")
          return res
            .status(400)
            .json({ ok: false, error: "Statut invalide pour validation" });

        w.status = "VALIDATED";
        w.processedAt = new Date();
        w.rejectionReason = null;
        w.failureReason = null;
        await w.save();

        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ ok: false, error: "Erreur validation" });
      }
    },
  );

  // =========================================================================
  // REJECT: PENDING/VALIDATED -> REJECTED + RESTAURATION DES FONDS
  // =========================================================================
  router.post(
    "/admin/withdrawals/:id/reject",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const reason = clampStr(req.body?.reason, 300);
        if (!reason) throw new Error("Motif requis");

        const w = await Withdrawal.findById(req.params.id).session(session);
        if (!w) throw new Error("Retrait introuvable");
        if (!["PENDING", "VALIDATED"].includes(w.status))
          throw new Error("Statut invalide pour rejet");

        const u = await User.findById(w.user).session(session);
        if (!u) throw new Error("Utilisateur introuvable");

        // 1. Restaurer le solde d'affichage sur le Profil (User)
        const snap = w.balancesSnapshot || {
          seller: 0,
          community: 0,
          affiliation: 0,
        };
        u.sellerBalance = money((u.sellerBalance || 0) + (snap.seller || 0));
        u.communityBalance = money(
          (u.communityBalance || 0) + (snap.community || 0),
        );
        u.affiliationBalance = money(
          (u.affiliationBalance || 0) + (snap.affiliation || 0),
        );

        w.status = "REJECTED";
        w.rejectionReason = reason;
        w.failureReason = null;
        w.processedAt = new Date();
        w.restoredAt = new Date();

        const uidStr = String(u._id);
        const uidObj = u._id;
        const userMatch = { $in: [uidObj, uidStr] };

        // 2. ✅ CORRECTION CRUCIALE : Libérer les fonds qui étaient en "pending_withdrawal"
        await SellerPayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "ready" } },
          { session },
        );
        await CoursePayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "ready" } },
          { session },
        );
        await AffiliationCommission.updateMany(
          { referrerId: userMatch, status: "pending_withdrawal" },
          { $set: { status: "available" } },
          { session },
        );

        await u.save({ session });
        await w.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 3. Notifications & Mails
        try {
          await createNotif({
            userId: String(u._id),
            kind: "finance_withdrawal_rejected",
            payload: {
              withdrawalId: String(w._id),
              reference: w.reference,
              amount: w.amountNet,
              reason,
              message: `Votre demande de retrait de ${w.amountNet}$ a été refusée. Raison: ${reason}`,
            },
          });
          if (u.email) {
            const {
              sendWithdrawalRejectedEmail,
            } = require("../../utils/mailer");
            await sendWithdrawalRejectedEmail({
              to: u.email,
              fullName: u.fullName || u.name || "",
              reference: w.reference,
              amountNet: w.amountNet,
              reason,
            });
          }
        } catch (e) {
          console.error("[EMAIL/NOTIF ERROR]", e);
        }

        return res.json({ ok: true });
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        console.error("[REJECT ERROR]", e);
        return res
          .status(400)
          .json({ ok: false, error: e.message || "Erreur rejet" });
      }
    },
  );

  // =========================================================================
  // MARK FAILED: VALIDATED -> FAILED + RESTAURATION DES FONDS
  // =========================================================================
  router.post(
    "/admin/withdrawals/:id/mark-failed",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const reason = clampStr(req.body?.reason, 300);
        if (!reason) throw new Error("Motif requis");

        const w = await Withdrawal.findById(req.params.id).session(session);
        if (!w) throw new Error("Retrait introuvable");
        if (w.status !== "VALIDATED")
          throw new Error("Statut invalide pour échec");

        const u = await User.findById(w.user).session(session);
        if (!u) throw new Error("Utilisateur introuvable");

        const snap = w.balancesSnapshot || {
          seller: 0,
          community: 0,
          affiliation: 0,
        };
        u.sellerBalance = money((u.sellerBalance || 0) + (snap.seller || 0));
        u.communityBalance = money(
          (u.communityBalance || 0) + (snap.community || 0),
        );
        u.affiliationBalance = money(
          (u.affiliationBalance || 0) + (snap.affiliation || 0),
        );

        w.status = "FAILED";
        w.failureReason = reason;
        w.processedAt = new Date();
        w.restoredAt = new Date();

        const uidStr = String(u._id);
        const uidObj = u._id;
        const userMatch = { $in: [uidObj, uidStr] };

        // ✅ CORRECTION CRUCIALE : Libérer les fonds
        await SellerPayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "ready" } },
          { session },
        );
        await CoursePayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "ready" } },
          { session },
        );
        await AffiliationCommission.updateMany(
          { referrerId: userMatch, status: "pending_withdrawal" },
          { $set: { status: "available" } },
          { session },
        );

        await u.save({ session });
        await w.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json({ ok: true });
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        console.error("[FAILED ERROR]", e);
        return res
          .status(400)
          .json({ ok: false, error: e.message || "Erreur mark failed" });
      }
    },
  );

  // =========================================================================
  // MARK PAID: VALIDATION DÉFINITIVE DU PAIEMENT
  // =========================================================================
  router.post(
    "/admin/withdrawals/:id/mark-paid",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const payoutRef = clampStr(req.body?.payoutRef, 200);
        const proof = clampStr(req.body?.proof, 500);

        const w = await Withdrawal.findById(req.params.id)
          .populate("user", "email fullName")
          .session(session);
        if (!w) throw new Error("Retrait introuvable");
        if (!["PENDING", "VALIDATED"].includes(w.status))
          throw new Error("Statut invalide pour marquer payé");

        w.status = "PAID";
        w.payoutRef = payoutRef;
        if (proof) w.proof = proof;
        w.processedAt = new Date();

        const uidStr = String(w.user._id);
        const uidObj = w.user._id;
        const userMatch = { $in: [uidObj, uidStr] };

        // ✅ VALIDATION FINALE : L'argent passe définitivement à "withdrawn"
        await SellerPayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "withdrawn" } },
          { session },
        );
        await CoursePayout.updateMany(
          { seller: userMatch, status: "pending_withdrawal" },
          { $set: { status: "withdrawn" } },
          { session },
        );
        await AffiliationCommission.updateMany(
          { referrerId: userMatch, status: "pending_withdrawal" },
          { $set: { status: "withdrawn" } },
          { session },
        );

        await w.save({ session });
        await session.commitTransaction();
        session.endSession();

        await createNotif({
          userId: String(w.user._id),
          kind: "finance_withdrawal_approved",
          payload: {
            withdrawalId: String(w._id),
            reference: w.reference,
            amount: w.amountNet,
            method: w.method,
            message: `Votre retrait de ${w.amountNet}$ a été approuvé et payé !`,
          },
        });

        if (w.user?.email) {
          try {
            const {
              sendWithdrawalApprovedEmail,
            } = require("../../utils/mailer");
            await sendWithdrawalApprovedEmail({
              to: w.user.email,
              fullName: w.user.fullName || "",
              reference: w.reference,
              amountNet: w.amountNet,
              method: w.method,
              proofUrl: w.proof || null,
            });
          } catch (emailErr) {
            console.error("[EMAIL ERROR]", emailErr);
          }
        }

        return res.json({ ok: true });
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(500)
          .json({ ok: false, error: e.message || "Erreur mark paid" });
      }
    },
  );

  // =========================================================================
  // UPLOAD PROOF
  // =========================================================================
  router.post(
    "/admin/withdrawals/:id/upload-proof",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      try {
        const multer = require("multer");
        const { uploadBuffer } = require("../../utils/storage");

        const upload = multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
          fileFilter: (_req, file, cb) => {
            const allowed = [
              "image/jpeg",
              "image/png",
              "image/webp",
              "application/pdf",
            ];
            if (allowed.includes(file.mimetype)) cb(null, true);
            else cb(new Error("TYPE_NOT_ALLOWED"));
          },
        });

        upload.single("proof")(req, res, async (err) => {
          if (err) {
            if (err.message === "TYPE_NOT_ALLOWED")
              return res
                .status(415)
                .json({ ok: false, error: "Type de fichier non supporté" });
            if (err.code === "LIMIT_FILE_SIZE")
              return res.status(413).json({
                ok: false,
                error: "Fichier trop volumineux (max 10MB)",
              });
            return res.status(400).json({ ok: false, error: err.message });
          }
          if (!req.file?.buffer)
            return res
              .status(400)
              .json({ ok: false, error: "Aucun fichier reçu" });

          const w = await Withdrawal.findById(req.params.id);
          if (!w)
            return res
              .status(404)
              .json({ ok: false, error: "Retrait introuvable" });

          const publicId = `withdrawal_${w.reference}_${Date.now()}`;
          const isPdf = req.file.mimetype === "application/pdf";
          const uploadResult = await uploadBuffer(req.file.buffer, {
            folder: "withdrawal-proofs",
            publicId,
            resourceType: isPdf ? "raw" : "image",
          });

          w.proof = uploadResult.secure_url;
          await w.save();

          return res.json({
            ok: true,
            data: { proofUrl: uploadResult.secure_url },
          });
        });
      } catch (e) {
        console.error("[UPLOAD PROOF ERROR]", e);
        return res.status(500).json({ ok: false, error: "Erreur upload" });
      }
    },
  );
};
