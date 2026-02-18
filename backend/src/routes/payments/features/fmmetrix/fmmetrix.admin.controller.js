// backend/src/routes/payments/features/fmmetrix/fmmetrix.admin.controller.js
"use strict";

const path = require("path");
const mongoose = require("mongoose");
const User = require("../../../../models/user.model");
const FmMetrixSubscription = require("../../../../models/fmmetrixSubscription.model");
const Service = require("./fmmetrix.service");

// ✅ Import fiable helpers auth
const { verifyAuthHeader, fail, ok } = require(
  path.join(__dirname, "../../../auth/_helpers"),
);

async function ensureAdmin(req) {
  let userId;
  try {
    const auth = verifyAuthHeader(req) || {};
    userId = auth.userId;
  } catch (err) {
    throw { status: 401, message: "Non authentifié" };
  }
  if (!userId) throw { status: 401, message: "Non authentifié" };

  const user = await User.findById(userId).select("roles email").lean();
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw { status: 403, message: "Admin requis" };
  }
  return { userId, email: user.email || null };
}

exports.listAll = async (req, res) => {
  try {
    await ensureAdmin(req);

    const statusFilter =
      (typeof req.query.status === "string" && req.query.status) ||
      (typeof req.query.statusFilter === "string" && req.query.statusFilter) ||
      null;

    const limitRaw = parseInt(String(req.query.limit || ""), 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 100;

    const query = {};
    if (statusFilter) query.status = statusFilter;

    const subs = await FmMetrixSubscription.find(query)
      .populate("userId", "email profile")
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 500))
      .lean();

    const items = subs.map((sub) => {
      const u = sub.userId;
      const uid = u?._id;

      const name =
        u?.profile?.fullName || u?.profile?.name || u?.email || "Inconnu";
      const email = u?.email;

      let status = sub.status || "active";
      const now = new Date();

      if (
        status === "active" &&
        sub.periodEnd &&
        new Date(sub.periodEnd) < now
      ) {
        status = "expired";
      }

      let provider = "manual";
      const raw = sub.raw || {};

      if (
        raw.provider === "manual_crypto" ||
        sub.stripeCustomerId === "MANUAL_CRYPTO"
      ) {
        provider = "manual_crypto";
      } else if (sub.stripeSessionId) {
        provider = "stripe";
      } else if (raw.source === "manual_admin") {
        provider = "manual_grant";
      }

      return {
        id: String(sub._id),
        userId: uid ? String(uid) : "",
        userName: name,
        userEmail: email,
        status,
        periodStart: sub.periodStart,
        periodEnd: sub.periodEnd,
        createdAt: sub.createdAt,
        provider,
        cryptoRef: sub.stripeSubscriptionId || null,
        amount: raw.declaredAmount ?? null,
        network: raw.network ?? null,
      };
    });

    return ok(res, { items, total: items.length });
  } catch (e) {
    const status = e.status || 500;
    return fail(res, e.message || "Erreur", status);
  }
};

exports.approveCrypto = async (req, res) => {
  try {
    const { userId: adminId } = await ensureAdmin(req);
    const { subscriptionId } = req.body || {};
    if (!subscriptionId) return fail(res, "subscriptionId requis", 400);

    await Service.approveCryptoPayment(subscriptionId, adminId);
    return ok(res, { ok: true });
  } catch (e) {
    const status = e.status || 500;
    console.error(e);
    return fail(res, e.message || "Erreur lors de l'approbation", status);
  }
};

exports.rejectCrypto = async (req, res) => {
  try {
    await ensureAdmin(req);
    const { subscriptionId } = req.body || {};
    if (!subscriptionId) return fail(res, "subscriptionId requis", 400);

    await FmMetrixSubscription.deleteOne({ _id: subscriptionId });
    return ok(res, { ok: true });
  } catch (e) {
    const status = e.status || 500;
    return fail(res, e.message || "Erreur suppression", status);
  }
};

exports.grantManual = async (req, res) => {
  try {
    const { userId: adminId } = await ensureAdmin(req);
    const { userId, months, periodStart, periodEnd } = req.body || {};
    if (!userId) return fail(res, "userId requis", 400);

    const { doc, subDoc } = await Service.grantManualAccess({
      userId,
      months,
      periodStart,
      periodEnd,
      adminId,
    });
    return ok(res, {
      ok: true,
      id: String(doc._id),
      subscriptionId: String(subDoc._id),
    });
  } catch (e) {
    const status = e.status || 500;
    console.error("[admin/grant] error:", e);
    return fail(res, e.message || "Erreur ajout manuel", status);
  }
};

exports.revoke = async (req, res) => {
  try {
    await ensureAdmin(req);
    const { userId } = req.params || {};
    if (!userId) return fail(res, "userId manquant", 400);

    await Service.revokeAccess(userId);
    return ok(res, { ok: true });
  } catch (e) {
    const status = e.status || 500;
    console.error("[admin/revoke] error:", e);
    return fail(res, e.message || "Erreur révocation", status);
  }
};

// 👇 LA FONCTION QUI MANQUAIT EST ICI 👇
// DANS : backend/src/routes/payments/features/fmmetrix/fmmetrix.admin.controller.js

exports.listPending = async (req, res) => {
  try {
    await ensureAdmin(req);

    const pendingSubs = await FmMetrixSubscription.find({
      status: "pending_crypto",
    })
      .populate("userId", "email profile")
      .sort({ createdAt: -1 })
      .lean();

    const items = pendingSubs.map((sub) => {
      const u = sub.userId || {};
      const raw = sub.raw || {};

      // ✅ CORRECTION ICI : On ajoute le fallback sur l'email
      // Comme ça, si le mec n'a pas mis son nom, on affiche son email en gras au lieu de "Inconnu"
      const name =
        u.profile?.fullName ||
        u.profile?.name ||
        u.email ||
        "Utilisateur Inconnu";

      return {
        id: String(sub._id),
        userId: u._id ? String(u._id) : "",
        userName: name, // On utilise la variable corrigée
        userEmail: u.email || "Email Inconnu",
        status: sub.status,
        createdAt: sub.createdAt,
        periodStart: sub.periodStart,
        periodEnd: sub.periodEnd,
        provider: "manual_crypto",
        cryptoRef: sub.stripeSubscriptionId || raw.cryptoRef || "N/A",
        amount: raw.declaredAmount || 29,
        network: raw.network || "TRC20",
      };
    });

    return ok(res, { ok: true, items, total: items.length });
  } catch (e) {
    console.error("[Admin] Erreur listPending:", e);
    return fail(res, e.message || "Erreur lors du chargement des cryptos", 500);
  }
};
