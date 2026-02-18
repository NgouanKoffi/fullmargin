// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\fmmetrix\fmmetrix.controller.js

// ✅ CORRECTION : Import des helpers d'auth
const { verifyAuthHeader, fail, ok } = require("../../../auth/_helpers");
const Service = require("./fmmetrix.service");

// ✅ Import des modèles
const FmMetrix = require("../../../../models/fmmetrix.model");
const FmMetrixSubscription = require("../../../../models/fmmetrixSubscription.model");

exports.checkout = async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const { url } = await Service.createCheckoutSession({
      userId,
      amount: req.body.amount,
      currency: req.body.currency,
      label: req.body.label,
      redirectBase: req.body.redirectBase,
      origin: req.headers.origin,
    });
    return ok(res, { url });
  } catch (e) {
    console.error("[fm-metrix] checkout error:", e);
    return fail(res, e.message || "Erreur Checkout", 500);
  }
};

exports.confirm = async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);
    if (!req.query.session_id) return fail(res, "session_id manquant", 400);

    const { periodEnd } = await Service.confirmSessionAndActivate(
      req.query.session_id,
      userId,
    );
    return ok(res, { saved: true, validUntil: periodEnd });
  } catch (e) {
    console.error("[fm-metrix] confirm error:", e);
    return fail(res, e.message || "Erreur Confirmation", 500);
  }
};

exports.getAccess = async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const sub = await FmMetrix.findOne({ userId }).lean();
    if (!sub) {
      return ok(res, {
        ok: true,
        allowed: false,
        exists: false,
        reason: "no_subscription",
      });
    }

    const now = new Date();
    // Sécurisation de la date ici aussi (déjà présent mais bonne pratique)
    const expiresAt = sub.validUntil ? new Date(sub.validUntil) : null;
    const msLeft = expiresAt ? expiresAt.getTime() - now.getTime() : -1;
    const allowed = expiresAt && msLeft > 0;

    return ok(res, {
      ok: true,
      allowed,
      exists: true,
      validUntil: sub.validUntil,
      secondsLeft: msLeft > 0 ? Math.floor(msLeft / 1000) : 0,
      reason: allowed ? "active" : "expired",
      stripeSubscriptionId: sub?.stripeSubscriptionId || null,
      stripeCustomerId: sub?.stripeCustomerId || null,
    });
  } catch (e) {
    return fail(res, "Erreur serveur", 500);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié", 401);

    const currentDoc = await FmMetrix.findOne({ userId }).lean();
    const historyDocs = await FmMetrixSubscription.find({ userId })
      .sort({ periodStart: -1 })
      .lean();

    const now = new Date();

    // Gestion de l'état actuel (Current)
    const currentValidUntil = currentDoc?.validUntil
      ? new Date(currentDoc.validUntil)
      : null;
    const isCurrentActive =
      currentValidUntil && currentValidUntil.getTime() > now.getTime();

    const current = currentDoc
      ? {
          id: String(currentDoc._id),
          startedAt: currentDoc.startedAt,
          validUntil: currentDoc.validUntil,
          status: isCurrentActive ? "active" : "expired",
        }
      : null;

    // Gestion de l'historique (Liste)
    const history = historyDocs.map((h) => {
      // ✅ FIX MAJEUR ICI : Conversion explicite en Date
      const endDate = h.periodEnd ? new Date(h.periodEnd) : null;
      // Comparaison par timestamp pour être sûr à 100%
      const isActive = endDate && endDate.getTime() > now.getTime();

      const raw = h.raw || {};
      let provider = "stripe";
      let amount = null;
      let currency = null;

      // Logique de détection du provider
      if (
        raw.provider === "manual_crypto" ||
        h.stripeCustomerId === "MANUAL_CRYPTO"
      ) {
        provider = "manual_crypto";
        amount = raw.declaredAmount || 0;
        currency = "usd";
      } else if (raw.source === "manual_admin") {
        provider = "manual_grant";
      } else {
        provider = "stripe";
        const s = raw || {};
        const total = s.amount_total || s.amount_subtotal || s.amount || 0;
        if (total) amount = total / 100;
        currency = (s.currency || "usd").toLowerCase();
      }

      return {
        id: String(h._id),
        periodStart: h.periodStart,
        periodEnd: h.periodEnd,
        // On force le statut basé sur la date, sauf si le doc dit explicitement "pending_crypto" ou autre
        status:
          h.status === "pending_crypto"
            ? h.status
            : isActive
              ? "active"
              : "expired",
        createdAt: h.createdAt,
        provider,
        amount,
        currency,
        // On passe aussi l'invoice ID si dispo pour le lien "Voir la facture"
        invoiceId: raw.invoice || null,
      };
    });

    return ok(res, { current, history });
  } catch (e) {
    console.error("[fm-metrix] history error:", e);
    return fail(res, "Erreur historique", 500);
  }
};
