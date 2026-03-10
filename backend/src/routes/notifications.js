// backend/src/routes/notifications.js
const express = require("express");
const router = express.Router();

const { verifyAuthHeader } = require("./auth/_helpers");
const Notification = require("../models/notification.model");
const { markNotifsSeen } = require("../utils/notifications");

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/**
 * GET /notifications
 */
router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    50,
    Math.max(parseInt(req.query.limit || "20", 10), 1),
  );

  try {
    const filter = {
      userId: req.auth.userId,
      kind: { $not: /^discussion_/ },
    };

    const [rows, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    // 👇 Log les kinds uniques pour débugger les "Nouvelle notification"
    const kinds = [...new Set(rows.map((n) => n.kind))];
    console.log(
      "[NOTIFICATIONS] kinds présents pour userId",
      req.auth.userId,
      ":",
      kinds,
    );

    return res.json({
      ok: true,
      data: {
        items: rows.map((n) => ({
          id: String(n._id),
          kind: n.kind,
          communityId: n.communityId ? String(n.communityId) : null,
          requestId: n.requestId ? String(n.requestId) : null,
          payload: n.payload || {},
          seen: !!n.seen,
          createdAt: n.createdAt,
        })),
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (e) {
    console.error("[NOTIFICATIONS] list ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/**
 * GET /notifications/unseen-count
 */
router.get("/unseen-count", requireAuth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.auth.userId,
      seen: false,
      kind: { $not: /^discussion_/ },
    });
    return res.json({ ok: true, data: { count } });
  } catch (e) {
    console.error("[NOTIFICATIONS] unseen-count ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/**
 * GET /notifications/unseen-count-by-category
 * ✅ Corrigé : course_* et group_* comptés dans "community"
 */
router.get("/unseen-count-by-category", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.auth.userId,
      seen: false,
      kind: { $not: /^discussion_/ },
    })
      .select("kind")
      .lean();

    const counts = {
      all: notifications.length,
      community: 0,
      marketplace: 0,
      finance: 0,
      admin: 0,
    };

    notifications.forEach((n) => {
      if (n.kind.startsWith("community_")) counts.community++;
      if (n.kind.startsWith("marketplace_")) counts.marketplace++;
      if (n.kind.startsWith("finance_")) counts.finance++;
      if (n.kind.startsWith("fmmetrix_")) counts.finance++;
      if (n.kind.startsWith("admin_")) counts.admin++;
      // ✅ Kinds communauté sans préfixe "community_"
      if (
        n.kind === "course_manual_enrollment" ||
        n.kind === "course_manual_unenrollment" ||
        n.kind === "group_manual_add_member" ||
        n.kind === "group_manual_remove_member"
      )
        counts.community++;
    });

    return res.json({ ok: true, data: counts });
  } catch (e) {
    console.error("[NOTIFICATIONS] count-by-category ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/**
 * POST /notifications/mark-seen
 */
router.post("/mark-seen", requireAuth, async (req, res) => {
  const { ids } = req.body || {};
  try {
    await markNotifsSeen(req.auth.userId, Array.isArray(ids) ? ids : []);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[NOTIFICATIONS] mark-seen ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Marquage impossible" });
  }
});

module.exports = router;
