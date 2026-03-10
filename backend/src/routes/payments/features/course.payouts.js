// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\course.payouts.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { verifyAuthHeader } = require("../../auth/_helpers");
const CoursePayout = require("../../../models/coursePayout.model");
const Course = require("../../../models/course.model");
const User = require("../../../models/user.model");

/* ----------------- Auth helper ----------------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a?.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* =========================================================
   GET /api/courses/payouts/mine (auth)
   ➜ Liste paginée des ventes du vendeur connecté (CoursePayout)
   Query:
     - page (def=1)
     - limit (def=20, max=50)
     - status? (available|pending|paid|all) [facultatif]
     - currency? (usd, eur, xof...)  [facultatif]
     - q? (recherche sur titre cours / acheteur email ou nom) [facultatif]
========================================================= */
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);
    const limit = Math.min(
      50,
      Math.max(parseInt(String(req.query.limit || "20"), 10), 1)
    );
    const skip = (page - 1) * limit;

    // ⬇️ On normalise le status, et on ignore "all"
    const rawStatus = (req.query.status || "").toString().trim().toLowerCase();
    const allowedStatuses = new Set(["available", "pending", "paid"]);
    const status = allowedStatuses.has(rawStatus) ? rawStatus : "";

    const currency = (req.query.currency || "").toString().trim().toLowerCase();
    const q = (req.query.q || "").toString().trim();

    const match = {
      seller: new mongoose.Types.ObjectId(String(req.auth.userId)),
    };
    // Si status est "available", "pending" ou "paid", on filtre. Sinon (all/vides) => aucun filtre
    if (status) match.status = status;
    if (currency) match.currency = currency;

    // Pipeline d'agrégation : jointure cours + acheteur
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
          pipeline: [
            { $project: { _id: 1, title: 1, coverUrl: 1, communityId: 1 } },
          ],
        },
      },
      { $addFields: { course: { $first: "$course" } } },
      {
        $lookup: {
          from: "users",
          localField: "buyer",
          foreignField: "_id",
          as: "buyer",
          pipeline: [
            {
              $project: {
                _id: 1,
                email: 1,
                name: 1,
                displayName: 1,
                fullName: 1,
                avatar: 1,
                avatarUrl: 1,
                photoURL: 1,
              },
            },
          ],
        },
      },
      { $addFields: { buyer: { $first: "$buyer" } } },
    ];

    // Filtre texte simple (q)
    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { "course.title": { $regex: q, $options: "i" } },
            { "buyer.email": { $regex: q, $options: "i" } },
            { "buyer.name": { $regex: q, $options: "i" } },
            { "buyer.displayName": { $regex: q, $options: "i" } },
            { "buyer.fullName": { $regex: q, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          status: 1,
          currency: 1,
          commissionRate: 1,
          // brut/net/commission en unités et en cents (au cas où)
          unitAmount: 1,
          grossAmount: 1,
          commissionAmount: 1,
          netAmount: 1,
          unitAmountCents: 1,
          grossAmountCents: 1,
          commissionAmountCents: 1,
          netAmountCents: 1,
          order: 1,
          course: 1,
          buyer: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    const [items, totalAgg] = await Promise.all([
      CoursePayout.aggregate(pipeline),
      CoursePayout.aggregate([
        { $match: match },
        ...(q
          ? [
              {
                $lookup: {
                  from: "courses",
                  localField: "course",
                  foreignField: "_id",
                  as: "course",
                  pipeline: [{ $project: { _id: 1, title: 1 } }],
                },
              },
              { $addFields: { course: { $first: "$course" } } },
              {
                $lookup: {
                  from: "users",
                  localField: "buyer",
                  foreignField: "_id",
                  as: "buyer",
                  pipeline: [{ $project: { _id: 1, email: 1, name: 1 } }],
                },
              },
              { $addFields: { buyer: { $first: "$buyer" } } },
              {
                $match: {
                  $or: [
                    { "course.title": { $regex: q, $options: "i" } },
                    { "buyer.email": { $regex: q, $options: "i" } },
                    { "buyer.name": { $regex: q, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        { $count: "total" },
      ]),
    ]);

    const total = totalAgg?.[0]?.total || 0;

    const mapped = items.map((r) => {
      const buyerName =
        r?.buyer?.displayName ||
        r?.buyer?.fullName ||
        r?.buyer?.name ||
        (r?.buyer?.email ? String(r.buyer.email).split("@")[0] : "Client");
      const buyerAvatar =
        r?.buyer?.avatar || r?.buyer?.avatarUrl || r?.buyer?.photoURL || "";

      return {
        id: String(r._id),
        status: r.status,
        currency: r.currency || "usd",
        amounts: {
          unit: r.unitAmount ?? null,
          gross: r.grossAmount ?? null,
          commission: r.commissionAmount ?? null,
          net: r.netAmount ?? null,
          unitCents: r.unitAmountCents ?? null,
          grossCents: r.grossAmountCents ?? null,
          commissionCents: r.commissionAmountCents ?? null,
          netCents: r.netAmountCents ?? null,
        },
        commissionRate: r.commissionRate ?? 0,
        orderId: r.order ? String(r.order) : null,
        createdAt: r.createdAt || null,
        course: r.course
          ? {
              id: String(r.course._id),
              title: r.course.title || "Cours",
              coverUrl: r.course.coverUrl || "",
              communityId: r.course.communityId
                ? String(r.course.communityId)
                : null,
            }
          : null,
        buyer: r.buyer
          ? {
              id: String(r.buyer._id),
              name: buyerName,
              avatar: buyerAvatar,
              email: r?.buyer?.email || "",
            }
          : null,
      };
    });

    return res.json({
      ok: true,
      data: {
        items: mapped,
        page,
        limit,
        total,
        hasMore: skip + mapped.length < total,
      },
    });
  } catch (e) {
    console.error("[PAYOUTS mine] ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

/* =========================================================
   GET /api/courses/payouts/mine/summary (auth)
   ➜ Résumé des soldes par devise pour le vendeur connecté
   Retourne un tableau par devise :
     - currency, available, pending, paidLifetime, grossLifetime, commissionLifetime
========================================================= */
router.get("/mine/summary", requireAuth, async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(String(req.auth.userId));

    const rows = await CoursePayout.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: "$currency",
          // totaux par statut
          available: {
            $sum: {
              $cond: [{ $eq: ["$status", "available"] }, "$netAmountCents", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$netAmountCents", 0],
            },
          },
          paidLifetime: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$netAmountCents", 0],
            },
          },

          // métriques globales de performance
          grossLifetime: { $sum: "$grossAmountCents" },
          commissionLifetime: { $sum: "$commissionAmountCents" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const toUnit = (cents) =>
      typeof cents === "number" ? Math.round(cents) / 100 : 0;

    const summary = rows.map((r) => ({
      currency: (r._id || "usd").toLowerCase(),
      available: toUnit(r.available),
      pending: toUnit(r.pending),
      paidLifetime: toUnit(r.paidLifetime),
      grossLifetime: toUnit(r.grossLifetime),
      commissionLifetime: toUnit(r.commissionLifetime),
      count: r.count || 0,
    }));

    return res.json({ ok: true, data: { summary } });
  } catch (e) {
    console.error("[PAYOUTS summary] ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Lecture impossible" });
  }
});

module.exports = { router };
