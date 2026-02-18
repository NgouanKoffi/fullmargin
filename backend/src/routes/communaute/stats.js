// backend/src/routes/communaute/stats.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Community = require("../../models/community.model");
const CommunityMember = require("../../models/communityMember.model");
const CommunityPost = require("../../models/communityPost.model");
const CommunityReview = require("../../models/communityReview.model");
const CommunityComment = require("../../models/communityComment.model");
const User = require("../../models/user.model");

// petit helper pour faire une map { '2025-11-04': 0, ... }
function buildLastNDaysMap(n) {
  const map = new Map();
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    map.set(key, 0);
  }
  return map;
}

// convertit la map en array triée [{date, count}]
function mapToSeries(map) {
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

// GET /communaute/:communityId/stats
router.get("/:communityId/stats", async (req, res) => {
  try {
    const { communityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ ok: false, error: "communityId invalide" });
    }

    const community = await Community.findById(communityId).lean();
    if (!community) {
      return res
        .status(404)
        .json({ ok: false, error: "Communauté introuvable" });
    }

    // on récupère éventuellement l’owner pour afficher son nom côté front
    let owner = null;
    if (community.ownerId) {
      owner = await User.findById(community.ownerId)
        .select({ fullName: 1, avatarUrl: 1 })
        .lean();
    }

    // on veut les 30 derniers jours pour faire les graphes
    const DAYS = 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (DAYS - 1));
    sinceDate.setHours(0, 0, 0, 0);

    // 🟣 IMPORTANT
    // dans ta DB tu as visiblement le owner dans CommunityMember
    // mais dans le document "community" tu as membersCount = 1 (sans owner)
    // → donc pour le total on prend le chiffre du doc
    const subscribersCount = community.membersCount || 0;

    // pour les séries quotidiennes, on lit la vraie table mais on enlève le owner
    const memberMatch = {
      communityId: new mongoose.Types.ObjectId(communityId),
      createdAt: { $gte: sinceDate },
    };
    if (community.ownerId) {
      memberMatch.userId = {
        $ne: new mongoose.Types.ObjectId(community.ownerId),
      };
    }

    // on lance les promesses en parallèle
    const [
      postsCount,
      commentsCount,
      reviewsCount,
      reviewsAgg,
      membersDaily,
      postsDaily,
      commentsDaily,
    ] = await Promise.all([
      // totaux
      CommunityPost.countDocuments({
        communityId,
        deletedAt: null,
      }),
      CommunityComment.countDocuments({
        communityId,
        deletedAt: null,
      }),
      CommunityReview.countDocuments({ communityId }),

      // moyenne de note
      CommunityReview.aggregate([
        { $match: { communityId: new mongoose.Types.ObjectId(communityId) } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),

      // séries par jour
      CommunityMember.aggregate([
        {
          $match: memberMatch,
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      CommunityPost.aggregate([
        {
          $match: {
            communityId: new mongoose.Types.ObjectId(communityId),
            deletedAt: null,
            createdAt: { $gte: sinceDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      CommunityComment.aggregate([
        {
          $match: {
            communityId: new mongoose.Types.ObjectId(communityId),
            deletedAt: null,
            createdAt: { $gte: sinceDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // on normalise les séries pour qu’il n’y ait pas de trous
    const membersSeries = buildLastNDaysMap(DAYS);
    for (const d of membersDaily) {
      membersSeries.set(d._id, d.count);
    }

    const postsSeries = buildLastNDaysMap(DAYS);
    for (const d of postsDaily) {
      postsSeries.set(d._id, d.count);
    }

    const commentsSeries = buildLastNDaysMap(DAYS);
    for (const d of commentsDaily) {
      commentsSeries.set(d._id, d.count);
    }

    // moyenne de notes
    const averageRating =
      Array.isArray(reviewsAgg) && reviewsAgg.length
        ? Number(reviewsAgg[0].avg)
        : null;

    return res.json({
      ok: true,
      data: {
        communityId,
        name: community.name,
        owner: owner
          ? {
              id: String(owner._id),
              fullName: owner.fullName,
              avatarUrl: owner.avatarUrl || "",
            }
          : null,

        // ================== BLOC "COUNTS" ==================
        counts: {
          subscribers: subscribersCount, // ✅ maintenant cohérent avec le doc communauté
          posts: postsCount,
          comments: commentsCount,
          reviews: reviewsCount,
          likes: community.likesCount || 0,
          membersFromCommunity: community.membersCount || 0,
        },

        // ================== BLOC "RATINGS" ==================
        ratings: {
          average: averageRating,
          totalReviews: reviewsCount,
        },

        // ================== BLOC "TIMELINES" ==================
        timelines: {
          members: mapToSeries(membersSeries),
          posts: mapToSeries(postsSeries),
          comments: mapToSeries(commentsSeries),
        },

        // ================== BLOC "META" ==================
        meta: {
          days: DAYS,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    console.error("GET /communaute/:communityId/stats error:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;
