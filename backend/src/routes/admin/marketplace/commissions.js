// backend/src/routes/admin/marketplace/commissions.js
const express = require("express");
const router = express.Router();

const AdminCommission = require("../../../models/adminCommission.model");
const Order = require("../../../models/order.model");
const SellerPayout = require("../../../models/sellerPayout.model");
const User = require("../../../models/user.model");
const { verifyAuthHeader } = require("../../auth/_helpers");

/* =======================================================
   Helpers
======================================================= */

/** Auth + rôle admin/agent requis */
function requireAdmin(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    const roles = Array.isArray(a.roles) ? a.roles : [];
    const isAllowed =
      roles.includes("admin") ||
      roles.includes("agent") ||
      roles.includes("owner");
    if (!isAllowed) {
      return res.status(403).json({ ok: false, error: "Accès refusé" });
    }
    req.auth = { userId: a.userId, roles };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

function toISO(d) {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
}

function parseRange(req) {
  const { dateFrom, dateTo } = req.query || {};
  let from = null;
  let to = null;
  if (dateFrom) {
    try {
      const base = new Date(dateFrom);
      from = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        0,
        0,
        0,
        0
      );
    } catch {}
  }
  if (dateTo) {
    try {
      const base = new Date(dateTo);
      to = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        23,
        59,
        59,
        999
      );
    } catch {}
  }
  return { from, to };
}

function buildStats(items) {
  const stats = {
    count: items.length,
    totalCommission: 0,
    byCurrency: {},
  };
  for (const it of items) {
    const cur = String(it.currency || "usd").toUpperCase();
    if (!stats.byCurrency[cur])
      stats.byCurrency[cur] = { count: 0, totalCommission: 0 };
    stats.byCurrency[cur].count += 1;
    stats.byCurrency[cur].totalCommission += Number(it.commissionAmount || 0);
    stats.totalCommission += Number(it.commissionAmount || 0);
  }
  return stats;
}

function miniUser(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    fullName: doc.fullName || "",
    email: doc.email || "",
    avatarUrl: doc.avatarUrl || "",
    roles: Array.isArray(doc.roles) ? doc.roles : [],
  };
}

/* =======================================================
   GET /api/admin/marketplace/commissions
   Liste paginée + filtres + stats
======================================================= */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      page: rawPage,
      limit: rawLimit,
      seller,
      buyer,
      product,
      order,
      currency,
      q,
      sort = "createdAt:desc",
    } = req.query || {};

    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(rawLimit, 10) || 25));
    const skip = (page - 1) * limit;

    const { from, to } = parseRange(req);

    // --- filtre mongo ---
    const where = {};
    if (seller) where.seller = seller;
    if (buyer) where.buyer = buyer;
    if (product) where.product = product;
    if (order) where.order = order;
    if (currency) where.currency = String(currency).toLowerCase();

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.$gte = from;
      if (to) where.createdAt.$lte = to;
    }

    // recherche simple (id de commande ou produit) — optionnel
    if (q && typeof q === "string" && q.trim().length > 0) {
      const cleaned = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(cleaned, "i");
      // on tente sur les ObjectId en string + garde-fous
      where.$or = [{ order: q }, { product: q }];
      // NOTE: pour un vrai search, penser à un index textuel ou moteur externe
    }

    // tri
    let sortObj = { createdAt: -1, _id: -1 };
    if (typeof sort === "string" && sort.includes(":")) {
      const [k, d] = sort.split(":");
      sortObj = { [k]: d === "asc" ? 1 : -1, _id: -1 };
    }

    // --- requêtes brutes ---
    const [rows, total] = await Promise.all([
      AdminCommission.find(where).sort(sortObj).skip(skip).limit(limit).lean(),
      AdminCommission.countDocuments(where),
    ]);

    // --- chargement des users (vendeur + acheteur) pour la page ---
    const userIds = Array.from(
      new Set(
        rows
          .flatMap((r) => [r.seller, r.buyer])
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    let usersById = new Map();
    if (userIds.length > 0) {
      const userDocs = await User.find({ _id: { $in: userIds } })
        .select("_id fullName email avatarUrl roles")
        .lean();
      usersById = new Map(userDocs.map((u) => [String(u._id), miniUser(u)]));
    }

    // projection légère pour le listing
    const items = rows.map((r) => {
      const sellerUser = r.seller ? usersById.get(String(r.seller)) : null;
      const buyerUser = r.buyer ? usersById.get(String(r.buyer)) : null;

      return {
        id: String(r._id),
        order: String(r.order),
        product: String(r.product),
        seller: String(r.seller),
        buyer: String(r.buyer),
        shop: r.shop ? String(r.shop) : null,
        qty: Number(r.qty || 0),
        currency: String(r.currency || "usd").toUpperCase(),
        commissionRate: Number(r.commissionRate || 0),
        commissionAmount: Number(r.commissionAmount || 0),
        commissionAmountCents: Number(r.commissionAmountCents || 0),
        createdAt: toISO(r.createdAt),
        updatedAt: toISO(r.updatedAt),

        // 👇 infos mini pour le modal côté front
        sellerUser,
        buyerUser,
      };
    });

    const stats = buildStats(items);
    const pageCount = Math.max(1, Math.ceil(total / limit));

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      data: {
        items,
        page,
        limit,
        total,
        pageCount,
        stats,
      },
    });
  } catch (e) {
    console.error("[ADMIN COMMISSIONS] LIST ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* =======================================================
   GET /api/admin/marketplace/commissions/:id
   Détail enrichi (commande + éventuels payouts + users)
======================================================= */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const row = await AdminCommission.findById(id).lean();

    if (!row) {
      return res
        .status(404)
        .json({ ok: false, error: "Commission introuvable" });
    }

    // enrichissements :
    // - commande associée
    // - lignes de la commande concernant ce produit/seller
    // - payout éventuel pour ce triplet (order, product, seller)
    // - users vendeur / acheteur
    const [ord, payout, sellerDoc, buyerDoc] = await Promise.all([
      Order.findById(row.order)
        .select(
          "_id user sellers shops currency totalAmount totalAmountCents status createdAt paidAt stripe items"
        )
        .lean(),
      SellerPayout.findOne({
        order: row.order,
        product: row.product,
        seller: row.seller,
      }).lean(),
      row.seller
        ? User.findById(row.seller)
            .select("_id fullName email avatarUrl roles")
            .lean()
        : null,
      row.buyer
        ? User.findById(row.buyer)
            .select("_id fullName email avatarUrl roles")
            .lean()
        : null,
    ]);

    const orderMeta = ord
      ? {
          id: String(ord._id),
          user: String(ord.user),
          sellers: (ord.sellers || []).map(String),
          shops: (ord.shops || []).map(String),
          currency: String(ord.currency || "usd").toUpperCase(),
          totalAmount: Number(ord.totalAmount || 0),
          totalAmountCents: Number(ord.totalAmountCents || 0),
          status: ord.status || "requires_payment",
          createdAt: toISO(ord.createdAt),
          paidAt: ord.paidAt ? toISO(ord.paidAt) : null,
          stripe: ord.stripe
            ? {
                paymentIntentId: ord.stripe.paymentIntentId || "",
                chargeId: ord.stripe.chargeId || "",
                receiptUrl: ord.stripe.receiptUrl || "",
                customerEmail: ord.stripe.customerEmail || "",
                paymentMethod: ord.stripe.paymentMethod || null,
                amounts: ord.stripe.amounts || null,
              }
            : null,
          // lignes de commande ciblées (même product + seller)
          items: Array.isArray(ord.items)
            ? ord.items
                .filter(
                  (it) =>
                    String(it.product) === String(row.product) &&
                    String(it.seller) === String(row.seller)
                )
                .map((it) => ({
                  product: String(it.product),
                  title: String(it.title || ""),
                  unitAmount: Number(it.unitAmount || 0),
                  qty: Number(it.qty || 1),
                  seller: String(it.seller),
                  shop: it.shop ? String(it.shop) : null,
                  // promo courte :
                  promo: it.promo
                    ? {
                        code: String(it.promo.code || ""),
                        scope: String(it.promo.scope || ""),
                        type: String(it.promo.type || ""),
                        value: Number(it.promo.value || 0),
                        discountUnit: Number(it.promo.discountUnit || 0),
                        finalUnit: Number(it.promo.finalUnit || 0),
                      }
                    : null,
                }))
            : [],
        }
      : null;

    const payoutMeta = payout
      ? {
          id: String(payout._id),
          status: payout.status,
          paidOutAt: payout.paidOutAt ? toISO(payout.paidOutAt) : null,
          currency: String(payout.currency || "usd").toUpperCase(),
          qty: Number(payout.qty || 0),
          unitAmount: Number(payout.unitAmount || 0),
          grossAmount: Number(payout.grossAmount || 0),
          commissionRate: Number(payout.commissionRate || 0),
          commissionAmount: Number(payout.commissionAmount || 0),
          netAmount: Number(payout.netAmount || 0),
          unitAmountCents: Number(payout.unitAmountCents || 0),
          grossAmountCents: Number(payout.grossAmountCents || 0),
          commissionAmountCents: Number(payout.commissionAmountCents || 0),
          netAmountCents: Number(payout.netAmountCents || 0),
        }
      : null;

    const commission = {
      id: String(row._id),
      order: String(row.order),
      product: String(row.product),
      seller: String(row.seller),
      buyer: String(row.buyer),
      shop: row.shop ? String(row.shop) : null,
      qty: Number(row.qty || 0),
      currency: String(row.currency || "usd").toUpperCase(),
      commissionRate: Number(row.commissionRate || 0),
      commissionAmount: Number(row.commissionAmount || 0),
      commissionAmountCents: Number(row.commissionAmountCents || 0),
      createdAt: toISO(row.createdAt),
      updatedAt: toISO(row.updatedAt),
    };

    const sellerUser = miniUser(sellerDoc);
    const buyerUser = miniUser(buyerDoc);

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      data: {
        commission,
        order: orderMeta,
        payout: payoutMeta,
        seller: sellerUser,
        buyer: buyerUser,
      },
    });
  } catch (e) {
    console.error("[ADMIN COMMISSIONS] DETAIL ERROR:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

module.exports = router;
