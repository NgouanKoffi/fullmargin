// backend/src/routes/sections/admin.withdrawals.js
const crypto = require("node:crypto");
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
  // LIST
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
          const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          refRegex = rx;

          const users = await User.find({
            $or: [
              { email: rx },
              { name: rx },
              { firstName: rx },
              { lastName: rx },
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

  // VALIDATE: PENDING -> VALIDATED
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
        if (w.status !== "PENDING") {
          return res
            .status(400)
            .json({ ok: false, error: "Statut invalide pour validation" });
        }

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

  // REJECT: PENDING/VALIDATED -> REJECTED + restore funds
  router.post(
    "/admin/withdrawals/:id/reject",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      try {
        const reason = clampStr(req.body?.reason, 300);
        if (!reason)
          return res.status(400).json({ ok: false, error: "Motif requis" });

        const w = await Withdrawal.findById(req.params.id).populate(
          "user",
          "email fullName"
        );
        if (!w)
          return res
            .status(404)
            .json({ ok: false, error: "Retrait introuvable" });
        if (!["PENDING", "VALIDATED"].includes(w.status)) {
          return res
            .status(400)
            .json({ ok: false, error: "Statut invalide pour rejet" });
        }

        const u = await User.findById(w.user._id);
        if (!u)
          return res
            .status(404)
            .json({ ok: false, error: "Utilisateur introuvable" });

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

        // ✅ IMPORTANT: Restaurer les payouts de "withdrawn" à "ready"
        await SellerPayout.updateMany(
          { seller: w.user._id, status: "withdrawn" },
          { $set: { status: "ready" } }
        );

        await CoursePayout.updateMany(
          { seller: w.user._id, status: "withdrawn" },
          { $set: { status: "ready" } }
        );

        await AffiliationCommission.updateMany(
          { referrerId: w.user._id, status: "withdrawn" },
          { $set: { status: "available" } }
        );

        await Promise.all([u.save(), w.save()]);

        // 🔔 Notification: retrait refusé
        await createNotif({
          userId: String(w.user._id),
          kind: "finance_withdrawal_rejected",
          payload: {
            withdrawalId: String(w._id),
            reference: w.reference,
            amount: w.amountNet,
            reason,
            message: `Votre demande de retrait de ${w.amountNet}$ a été refusée. Raison: ${reason}`,
          },
        });

        // ✅ Send rejection email
        if (w.user?.email) {
          try {
            const { sendWithdrawalRejectedEmail } = require("../../utils/mailer");
            await sendWithdrawalRejectedEmail({
              to: w.user.email,
              fullName: w.user.fullName || "",
              reference: w.reference,
              amountNet: w.amountNet,
              reason: reason,
            });
          } catch (emailErr) {
            console.error("[EMAIL ERROR]", emailErr);
            // Don't fail the request if email fails
          }
        }

        return res.json({ ok: true });
      } catch (e) {
        console.error("[REJECT ERROR]", e);
        return res.status(500).json({ ok: false, error: "Erreur rejet" });
      }
    },
  );

  // UPLOAD PROOF: Upload image or PDF as proof of payment
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
            if (allowed.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error("TYPE_NOT_ALLOWED"));
            }
          },
        });

        upload.single("proof")(req, res, async (err) => {
          if (err) {
            if (err.message === "TYPE_NOT_ALLOWED") {
              return res
                .status(415)
                .json({ ok: false, error: "Type de fichier non supporté" });
            }
            if (err.code === "LIMIT_FILE_SIZE") {
              return res
                .status(413)
                .json({ ok: false, error: "Fichier trop volumineux (max 10MB)" });
            }
            return res.status(400).json({ ok: false, error: err.message });
          }

          if (!req.file?.buffer) {
            return res
              .status(400)
              .json({ ok: false, error: "Aucun fichier reçu" });
          }

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

          return res.json({ ok: true, data: { proofUrl: uploadResult.secure_url } });
        });
      } catch (e) {
        console.error("[UPLOAD PROOF ERROR]", e);
        return res.status(500).json({ ok: false, error: "Erreur upload" });
      }
    }
  );

  // MARK PAID: PENDING/VALIDATED -> PAID + send email
  router.post(
    "/admin/withdrawals/:id/mark-paid",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      try {
        const payoutRef = clampStr(req.body?.payoutRef, 200);
        const proof = clampStr(req.body?.proof, 500);

        const w = await Withdrawal.findById(req.params.id).populate(
          "user",
          "email fullName"
        );
        if (!w)
          return res
            .status(404)
            .json({ ok: false, error: "Retrait introuvable" });

        // ✅ AJUSTEMENT ICI : On accepte PENDING ou VALIDATED
        if (!["PENDING", "VALIDATED"].includes(w.status)) {
          return res
            .status(400)
            .json({ ok: false, error: "Statut invalide pour marquer payé" });
        }

        w.status = "PAID";
        w.payoutRef = payoutRef;
        if (proof) w.proof = proof;
        w.processedAt = new Date();
        await w.save();

        // 🔔 Notification: retrait approuvé
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

        // ✅ Send email notification
        if (w.user?.email) {
          try {
            const { sendWithdrawalApprovedEmail } = require("../../utils/mailer");
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
            // Don't fail the request if email fails
          }
        }

        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ ok: false, error: "Erreur mark paid" });
      }
    }
  );

  // MARK FAILED: VALIDATED -> FAILED + restore funds
  router.post(
    "/admin/withdrawals/:id/mark-failed",
    requireAuth,
    requireAdminOrAgent,
    async (req, res) => {
      try {
        const reason = clampStr(req.body?.reason, 300);
        if (!reason)
          return res.status(400).json({ ok: false, error: "Motif requis" });

        const w = await Withdrawal.findById(req.params.id);
        if (!w)
          return res
            .status(404)
            .json({ ok: false, error: "Retrait introuvable" });
        if (w.status !== "VALIDATED") {
          return res
            .status(400)
            .json({ ok: false, error: "Statut invalide pour échec" });
        }

        const u = await User.findById(w.user);
        if (!u)
          return res
            .status(404)
            .json({ ok: false, error: "Utilisateur introuvable" });

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

        await Promise.all([u.save(), w.save()]);
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ ok: false, error: "Erreur mark failed" });
      }
    },
  );
};
