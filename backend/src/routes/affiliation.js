// backend/src/routes/affiliation.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/user.model");
const AffiliationCommission = require("../models/affiliationCommission.model");
const { ok, fail, verifyAuthHeader } = require("./auth/_helpers");

// ✅ utilise le helper pour choisir la bonne base (dev/prod)
const { buildFrontendBase } = require("./auth/_helpers");
const PUBLIC_WEB_BASE_URL =
  process.env.PUBLIC_WEB_BASE_URL || buildFrontendBase();

/* Utils */
function makeCode(len = 8) {
  return crypto
    .randomBytes(6)
    .toString("base64url")
    .slice(0, len)
    .toUpperCase();
}

async function buildAffiliationPayload(me) {
  const code = me.referralCode || null;
  const link = code
    ? `${PUBLIC_WEB_BASE_URL}/auth?tab=signup&ref=${encodeURIComponent(code)}`
    : null;

  const affiliates = await User.find({ referredBy: me._id })
    .select("_id fullName email avatarUrl createdAt")
    .sort({ createdAt: -1 })
    .lean();

  // 👇 on récupère aussi ce qu'il a gagné comme parrain
  const commissions = await AffiliationCommission.find({
    referrerId: me._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  const totalByCurrency = {};
  for (const c of commissions) {
    const cur = c.currency || "usd";
    if (!totalByCurrency[cur]) totalByCurrency[cur] = 0;
    totalByCurrency[cur] += c.amount || 0;
  }

  return {
    code,
    link,
    affiliates: affiliates.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      joinedAt: u.createdAt ? u.createdAt.toISOString() : undefined,
    })),
    commissions: commissions.map((c) => ({
      id: String(c._id),
      userId: String(c.userId),
      subscriptionId: String(c.subscriptionId),
      monthIndex: c.monthIndex,
      rate: c.rate,
      amount: c.amount,
      currency: c.currency || "usd",
      source: c.source || "fm-metrix",
      createdAt: c.createdAt,
    })),
    totals: totalByCurrency,
  };
}

/* ============ GET /affiliation/me ============ */
router.get("/me", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");

    const me = await User.findById(userId).lean();
    if (!me) return fail(res, "User not found");

    const data = await buildAffiliationPayload(me);
    return ok(res, {
      data: {
        ...data,
        count: data.affiliates.length,
      },
    });
  } catch (e) {
    console.error("GET /affiliation/me:", e?.message || e);
    return fail(res, "Server error");
  }
});

/* ============ POST /affiliation/generate ============ */
router.post("/generate", async (req, res) => {
  try {
    const { userId } = verifyAuthHeader(req);
    if (!userId) return fail(res, "Non authentifié");

    const me = await User.findById(userId);
    if (!me) return fail(res, "User not found");

    if (me.referralCode) {
      const data = await buildAffiliationPayload(me);
      return ok(res, { data: { ...data, count: data.affiliates.length } });
    }

    let code = null;
    for (let i = 0; i < 6; i++) {
      const candidate = makeCode(8);
      const exists = await User.exists({ referralCode: candidate });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) return fail(res, "Impossible de générer un code unique");

    me.referralCode = code;
    await me.save();

    const data = await buildAffiliationPayload(me);
    return ok(res, { data: { ...data, count: data.affiliates.length } });
  } catch (e) {
    console.error("POST /affiliation/generate:", e?.message || e);
    return fail(res, "Server error");
  }
});

module.exports = router;
