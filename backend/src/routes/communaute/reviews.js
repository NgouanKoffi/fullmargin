const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Community = require("../../models/community.model");
const CommunityReview = require("../../models/communityReview.model");
const Notification = require("../../models/notification.model");
const { verifyAuthHeader } = require("../auth/_helpers");

/* ---------- helpers auth & charge communauté ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

async function getCommunityOr404(id, res) {
  try {
    const c = await Community.findOne({ _id: id, deletedAt: null }).lean();
    if (!c) {
      res.status(404).json({ ok: false, error: "Communauté introuvable" });
      return null;
    }
    return c;
  } catch {
    res.status(400).json({ ok: false, error: "Requête invalide" });
    return null;
  }
}

/* ---------- util agrégat ---------- */
async function applyAggregateDelta(communityId, deltaCount, deltaSum) {
  await Community.updateOne(
    { _id: communityId },
    {
      $inc: { ratingsCount: deltaCount, ratingsSum: deltaSum },
      $setOnInsert: { ratingsCount: 0, ratingsSum: 0 },
    },
    { upsert: false }
  );
}

/* ---------- petit helper notif ---------- */
async function createNotif({
  userId,
  kind,
  communityId = null,
  reviewId = null,
  payload = {},
}) {
  if (!userId || !kind) return;
  try {
    await Notification.create({
      userId,
      kind, // ex: "community_review_received"
      communityId,
      requestId: reviewId, // on réutilise ce champ
      payload,
      seen: false,
    });
  } catch (e) {
    console.error("[NOTIF][REVIEWS] create failed:", e?.message || e);
  }
}

/* =========================================================
   ⚠️ IMPORTANT : routes spécifiques AVANT "/:communityId"
   ========================================================= */

/* ---------------------------------------------------------
   ✅ GET /communaute/reviews/counters/me
   - combien d’avis non vus pour ce user
----------------------------------------------------------*/
router.get("/counters/me", requireAuth, async (req, res) => {
  try {
    const unseen = await Notification.countDocuments({
      userId: req.auth.userId,
      kind: "community_review_received",
      seen: false,
    });
    return res.json({ ok: true, data: { unseen } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   ✅ POST /communaute/reviews/mark-seen
   - le owner dit "j’ai vu"
----------------------------------------------------------*/
router.post("/mark-seen", requireAuth, async (req, res) => {
  const { reviewIds } = req.body || {};
  const base = {
    userId: req.auth.userId,
    kind: "community_review_received",
    seen: false,
  };

  // si on envoie une liste d'avis précis
  if (Array.isArray(reviewIds) && reviewIds.length > 0) {
    base.requestId = { $in: reviewIds };
  }

  try {
    await Notification.updateMany(base, { $set: { seen: true } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Marquage impossible" });
  }
});

/* ---------------------------------------------------------
   GET /communaute/reviews/my/me
   - les avis postés par CE user (toutes communautés)
   (ton chemin avait déjà /my/me, on le garde)
----------------------------------------------------------*/
router.get("/my/me", requireAuth, async (req, res) => {
  try {
    const rows = await CommunityReview.find({ userId: req.auth.userId })
      .sort({ updatedAt: -1 })
      .populate("communityId", "_id name slug coverUrl logoUrl")
      .lean();

    const items = rows.map((r) => ({
      id: String(r._id),
      community: r.communityId
        ? {
            id: String(r.communityId._id),
            name: r.communityId.name,
            slug: r.communityId.slug,
            coverUrl: r.communityId.coverUrl || "",
            logoUrl: r.communityId.logoUrl || "",
          }
        : null,
      rating: r.rating,
      comment: r.comment || "",
      hidden: !!r.hidden,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[REVIEWS] my ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* ---------------------------------------------------------
   POST /communaute/reviews/upsert
   - créer ou mettre à jour mon avis sur une communauté
----------------------------------------------------------*/
router.post("/upsert", requireAuth, async (req, res) => {
  const { communityId, rating, comment = "" } = req.body || {};
  if (!communityId || !rating) {
    return res
      .status(400)
      .json({ ok: false, error: "communityId et rating requis" });
  }

  const c = await getCommunityOr404(communityId, res);
  if (!c) return;

  try {
    const prev = await CommunityReview.findOne({
      communityId,
      userId: req.auth.userId,
    }).lean();

    if (!prev) {
      // création
      const doc = await CommunityReview.create({
        communityId,
        userId: req.auth.userId,
        rating,
        comment: String(comment).slice(0, 2000),
      });
      await applyAggregateDelta(communityId, +1, +rating);

      // notifier le owner si ce n’est pas lui
      if (String(c.ownerId) !== String(req.auth.userId)) {
        await createNotif({
          userId: c.ownerId,
          kind: "community_review_received",
          communityId: c._id,
          reviewId: doc._id,
          payload: {
            fromUserId: req.auth.userId,
            rating,
            comment: String(comment).slice(0, 120),
            communityName: c.name,
          },
        });
      }

      return res.json({
        ok: true,
        data: { id: String(doc._id), mode: "created" },
      });
    } else {
      // mise à jour
      const oldRating = Number(prev.rating || 0);
      await CommunityReview.updateOne(
        { _id: prev._id },
        { $set: { rating, comment: String(comment).slice(0, 2000) } }
      );
      await applyAggregateDelta(communityId, 0, rating - oldRating);

      return res.json({
        ok: true,
        data: { id: String(prev._id), mode: "updated" },
      });
    }
  } catch (e) {
    console.error("[REVIEWS] upsert ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Impossible d'enregistrer l'avis" });
  }
});

/* ---------------------------------------------------------
   DELETE /communaute/reviews/:id
   - supprimer son avis (ou owner)
----------------------------------------------------------*/
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const r = await CommunityReview.findOne({ _id: id });
    if (!r)
      return res.status(404).json({ ok: false, error: "Avis introuvable" });

    const c = await getCommunityOr404(r.communityId, res);
    if (!c) return;

    const isOwner = String(c.ownerId) === String(req.auth.userId);
    const isAuthor = String(r.userId) === String(req.auth.userId);
    if (!isOwner && !isAuthor)
      return res.status(403).json({ ok: false, error: "Interdit" });

    await CommunityReview.deleteOne({ _id: id });
    await applyAggregateDelta(r.communityId, -1, -Number(r.rating || 0));

    // optionnel : notif au owner si quelqu'un d'autre supprime
    if (!isOwner && String(c.ownerId) !== String(req.auth.userId)) {
      await createNotif({
        userId: c.ownerId,
        kind: "community_review_deleted",
        communityId: c._id,
        reviewId: r._id,
        payload: {
          fromUserId: req.auth.userId,
          rating: r.rating,
          communityName: c.name,
        },
      });
    }

    return res.json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error("[REVIEWS] delete ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ---------------------------------------------------------
   PATCH /communaute/reviews/:id/hide
   - modération par le owner
----------------------------------------------------------*/
router.patch("/:id/hide", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { hidden = true } = req.body || {};
  try {
    const r = await CommunityReview.findOne({ _id: id }).lean();
    if (!r)
      return res.status(404).json({ ok: false, error: "Avis introuvable" });

    const c = await getCommunityOr404(r.communityId, res);
    if (!c) return;
    if (String(c.ownerId) !== String(req.auth.userId))
      return res.status(403).json({ ok: false, error: "Interdit" });

    await CommunityReview.updateOne(
      { _id: id },
      { $set: { hidden: !!hidden } }
    );
    return res.json({ ok: true, data: { hidden: !!hidden } });
  } catch (e) {
    console.error("[REVIEWS] hide ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
});

/* =========================================================
   🚩 enfin, la route générique publique
   ========================================================= */

/* ---------------------------------------------------------
   GET /communaute/reviews/:communityId
   - liste publique d’une communauté
----------------------------------------------------------*/
router.get("/:communityId", async (req, res) => {
  const { communityId } = req.params;
  const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit ?? "10", 10), 1),
    50
  );

  if (!mongoose.isValidObjectId(communityId)) {
    return res.status(400).json({ ok: false, error: "communityId invalide" });
  }

  try {
    const [rows, total] = await Promise.all([
      CommunityReview.find({ communityId, hidden: false })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate("userId", "_id fullName avatarUrl")
        .lean(),
      CommunityReview.countDocuments({ communityId, hidden: false }),
    ]);

    const items = rows.map((r) => ({
      id: String(r._id),
      user: r.userId
        ? {
            id: String(r.userId._id),
            fullName: r.userId.fullName || "",
            avatarUrl: r.userId.avatarUrl || "",
          }
        : null,
      rating: r.rating,
      comment: r.comment || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.json({ ok: true, data: { items, page, limit, total } });
  } catch (e) {
    console.error("[REVIEWS] list ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

module.exports = router;
