// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\admin\analytics.js
const express = require("express");
const router = express.Router();
const { AnalyticsEvent } = require("../../analytics/models");
const { verifyAuthHeader } = require("../auth/_helpers");

/* ------------ middlewares ------------ */
// Autorise admin **ou** agent
function requireAdmin(req, res, next) {
  try {
    const { token, userId, roles } = verifyAuthHeader(req);
    if (!token || !userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rs = Array.isArray(roles) ? roles : [];
    const isStaff = rs.includes("admin") || rs.includes("agent");
    if (!isStaff) {
      return res.status(403).json({ error: "forbidden" });
    }
    req.auth = { userId, roles: rs };
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

router.use(requireAdmin);

/* ------------ helpers ------------ */
function parseRange(q) {
  const to = q.to ? new Date(q.to) : new Date();
  const from = q.from
    ? new Date(q.from)
    : new Date(to.getTime() - 7 * 24 * 3600 * 1000);
  return { from, to };
}

// MongoDB ≥5
function truncExpr(field, unit) {
  return { $dateTrunc: { date: `$${field}`, unit, timezone: "UTC" } };
}

/* ===== filtre: exclure toutes les pages admin ===== */
const EXCLUDE_ADMIN = { path: { $not: /^\/admin(\/|$)/i } };

/* ------------ petites utils consent ------------ */
const CONSENT_OK = /^(accepted|allow|granted|oui|accept|consent_ok)$/i;
const CONSENT_KO = /^(rejected|declined|denied|refused|refus|no|non)$/i;

function normalizeConsent(v = "") {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (CONSENT_OK.test(s)) return "accepted";
  if (CONSENT_KO.test(s)) return "rejected";
  return "other";
}

/** agrège les consentements par visiteur unique sur la période */
async function aggregateConsentVisitors(from, to) {
  // (1) visiteurs uniques total (hors /admin)
  const uvAgg = await AnalyticsEvent.aggregate([
    {
      $match: {
        type: "pageview",
        firstAt: { $gte: from, $lte: to },
        ...EXCLUDE_ADMIN,
      },
    },
    { $group: { _id: "$visitorId" } },
    { $count: "c" },
  ]);
  const uniqueVisitors = uvAgg[0]?.c || 0;

  // (2) consentements connus par visiteur
  const byConsent = await AnalyticsEvent.aggregate([
    {
      $match: {
        type: "pageview",
        firstAt: { $gte: from, $lte: to },
        ...EXCLUDE_ADMIN,
        cookieConsent: { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: { visitorId: "$visitorId", c: { $toLower: "$cookieConsent" } },
      },
    },
    {
      $group: {
        _id: "$_id.c",
        visitors: { $sum: 1 },
      },
    },
  ]);

  let acceptedVisitors = 0;
  let rejectedVisitors = 0;
  let otherVisitors = 0;

  for (const row of byConsent) {
    const key = normalizeConsent(row._id);
    if (key === "accepted") acceptedVisitors += row.visitors;
    else if (key === "rejected") rejectedVisitors += row.visitors;
    else otherVisitors += row.visitors;
  }

  const consentKnownVisitors =
    acceptedVisitors + rejectedVisitors + otherVisitors;
  const undecidedVisitors = Math.max(0, uniqueVisitors - consentKnownVisitors);

  return {
    uniqueVisitors,
    acceptedVisitors,
    rejectedVisitors,
    undecidedVisitors,
  };
}

/* ------------ GET /summary ------------ */
/**
 * ?from=ISO&to=ISO
 * {
 *   totalPageviews, uniqueVisitors,
 *   consents: { acceptedVisitors, rejectedVisitors, undecidedVisitors }
 * }
 */
router.get("/summary", async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query);

    const [pvCount, uvAgg, consents] = await Promise.all([
      AnalyticsEvent.countDocuments({
        type: "pageview",
        firstAt: { $gte: from, $lte: to },
        ...EXCLUDE_ADMIN,
      }),
      AnalyticsEvent.aggregate([
        {
          $match: {
            type: "pageview",
            firstAt: { $gte: from, $lte: to },
            ...EXCLUDE_ADMIN,
          },
        },
        { $group: { _id: "$visitorId" } },
        { $count: "c" },
      ]),
      aggregateConsentVisitors(from, to),
    ]);

    const uniqueVisitors = uvAgg[0]?.c || 0;

    return res.json({
      totalPageviews: pvCount || 0,
      uniqueVisitors,
      consents, // { acceptedVisitors, rejectedVisitors, undecidedVisitors }
    });
  } catch (e) {
    return next(e);
  }
});

/* ------------ GET /timeseries ------------ */
/**
 * ?interval=day|week&from=ISO&to=ISO
 * [
 *   { date, pageviews, visitors }
 * ]
 */
router.get("/timeseries", async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query);
    const interval = req.query.interval === "week" ? "week" : "day";

    const pv = await AnalyticsEvent.aggregate([
      {
        $match: {
          type: "pageview",
          firstAt: { $gte: from, $lte: to },
          ...EXCLUDE_ADMIN,
        },
      },
      {
        $group: {
          _id: truncExpr("firstAt", interval),
          pageviews: { $sum: 1 },
          visitorsSet: { $addToSet: "$visitorId" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          pageviews: 1,
          visitors: { $size: "$visitorsSet" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return res.json(pv);
  } catch (e) {
    return next(e);
  }
});

/* ------------ GET /top-pages ------------ */
/**
 * ?limit=8&from=ISO&to=ISO
 * [{ path, views }]
 */
router.get("/top-pages", async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 8);

    const items = await AnalyticsEvent.aggregate([
      {
        $match: {
          type: "pageview",
          firstAt: { $gte: from, $lte: to },
          ...EXCLUDE_ADMIN,
        },
      },
      { $group: { _id: { $ifNull: ["$path", "/"] }, views: { $sum: 1 } } },
      { $project: { _id: 0, path: "$_id", views: 1 } },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    return res.json(items);
  } catch (e) {
    return next(e);
  }
});

/* ------------ GET /consents ------------ */
/**
 * ?from=ISO&to=ISO
 * {
 *   uniqueVisitors,
 *   acceptedVisitors,
 *   rejectedVisitors,
 *   undecidedVisitors
 * }
 */
router.get("/consents", async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query);
    const r = await aggregateConsentVisitors(from, to);
    return res.json(r);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
