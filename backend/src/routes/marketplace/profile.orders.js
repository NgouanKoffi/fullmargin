// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\profile.orders.js
const express = require("express");
const router = express.Router();

const Order = require("../../models/order.model");
const SellerPayout = require("../../models/sellerPayout.model");
const Product = require("../../models/product.model"); // ✅ NEW
const { verifyAuthHeader } = require("../auth/_helpers");

/* ---------- Stripe (enrichissement optionnel, mais on n’expose plus) ---------- */
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

/* =======================================================
   Helpers
======================================================= */

/* ---------- auth ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    }
    req.auth = { userId: a.userId };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ---------- dates / formats ---------- */
const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};

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
        0,
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
        999,
      );
    } catch {}
  }
  return { from, to };
}

/* ---------- stats ---------- */
function buildStats(items, { currencyKey = "currency" } = {}) {
  const stats = {
    count: items.length,
    gross: 0,
    commission: 0,
    net: 0,
    byCurrency: {},
  };
  for (const it of items) {
    const cur = String(it[currencyKey] || "USD").toUpperCase();
    if (!stats.byCurrency[cur])
      stats.byCurrency[cur] = { count: 0, gross: 0, commission: 0, net: 0 };
    stats.byCurrency[cur].count += 1;
    stats.byCurrency[cur].gross += Number(
      it.grossAmount || it.totalAmount || 0,
    );
    stats.byCurrency[cur].commission += Number(it.commissionAmount || 0);
    stats.byCurrency[cur].net += Number(it.netAmount || it.totalAmount || 0);
    stats.gross += Number(it.grossAmount || it.totalAmount || 0);
    stats.commission += Number(it.commissionAmount || 0);
    stats.net += Number(it.netAmount || it.totalAmount || 0);
  }
  return stats;
}

/* ---------- promos: helpers lecture ---------- */
/** Normalise les métadonnées promo présentes (tolérant à l’absence de champs) */
function decorateItemPromo(rawItem) {
  const originalUnitAmount =
    typeof rawItem.baseUnitAmount === "number"
      ? Number(rawItem.baseUnitAmount)
      : null;

  const finalUnitAmount =
    typeof rawItem.unitAmount === "number" ? Number(rawItem.unitAmount) : 0;

  const promoCode = (rawItem.promoCode && String(rawItem.promoCode)) || null;

  // wasDiscounted si on a un baseUnitAmount > unitAmount, ou si code présent
  const wasDiscounted =
    (originalUnitAmount != null && originalUnitAmount > finalUnitAmount) ||
    !!promoCode;

  return {
    promoCode,
    wasDiscounted,
    originalUnitAmount,
    finalUnitAmount,
  };
}

/** Extrait un résumé au niveau commande */
function buildAppliedPromos(orderItems) {
  const set = new Set();
  const out = [];
  for (const it of orderItems || []) {
    const { promoCode, wasDiscounted } = decorateItemPromo(it);
    if (wasDiscounted && promoCode) {
      const key = `${String(it.product)}|${promoCode}`;
      if (!set.has(key)) {
        set.add(key);
        out.push({ product: String(it.product || ""), code: promoCode });
      }
    }
  }
  return out;
}

/* ---------- Stripe meta fetcher (optionnel – plus exposé au front) ---------- */
async function fetchStripeMeta(paymentIntentId) {
  if (!stripe || !paymentIntentId) return null;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: [
        "latest_charge",
        "latest_charge.payment_method_details",
        "charges.data.balance_transaction",
      ],
    });

    const charge =
      (pi.latest_charge &&
        typeof pi.latest_charge !== "string" &&
        pi.latest_charge) ||
      (pi.charges && pi.charges.data && pi.charges.data[0]) ||
      null;

    let fee = null;
    let net = null;
    let exchange_rate = null;
    if (
      charge &&
      charge.balance_transaction &&
      typeof charge.balance_transaction !== "string"
    ) {
      fee =
        charge.balance_transaction.fee != null
          ? charge.balance_transaction.fee
          : null;
      net =
        charge.balance_transaction.net != null
          ? charge.balance_transaction.net
          : null;
      exchange_rate = charge.balance_transaction.exchange_rate || null;
    }

    const pmd = charge?.payment_method_details || {};
    const card = pmd.card || {};
    const receiptUrl = charge?.receipt_url || null;

    return {
      paymentIntentId: pi.id,
      status: pi.status,
      amount: pi.amount,
      amountCaptured:
        pi.amount_capturable != null
          ? pi.amount - pi.amount_capturable
          : (pi.amount_captured ?? null),
      amountRefunded: pi.amount_refunded ?? null,
      currency: (pi.currency || "usd").toUpperCase(),
      paid: charge?.paid ?? pi.status === "succeeded",
      captured: charge?.captured ?? undefined,
      refunded: charge?.refunded ?? false,
      chargeId: charge?.id || null,
      receiptUrl,
      paymentMethod: {
        type: pmd.type || "card",
        brand: card.brand || null,
        last4: card.last4 || null,
        exp_month: card.exp_month || null,
        exp_year: card.exp_year || null,
      },
      balanceTx: {
        fee,
        net,
        exchange_rate,
      },
    };
  } catch (e) {
    console.warn("[orders] fetchStripeMeta error:", e?.message || e);
    return null;
  }
}

async function attachStripe(orderObj, dbStripe, { withStripe }) {
  const pid =
    (dbStripe && dbStripe.paymentIntentId) || orderObj.paymentReference || null;

  if (!withStripe || !pid) return;

  const meta = await fetchStripeMeta(pid);
  if (!meta) return;

  // ⚠️ On ne remplit PAS receiptUrl ici pour le front marketplace,
  // car on ne veut plus exposer le lien Stripe/FedaPay brut.
  orderObj.stripeMeta = meta;
}

/* =======================================================
   ✅ Product image enrichment (purchases + sales)
======================================================= */
async function buildProductMetaMapFromOrders(orders) {
  const ids = new Set();
  for (const o of orders || []) {
    for (const it of o.items || []) {
      if (it?.product) ids.add(String(it.product));
    }
  }
  const productIds = Array.from(ids);
  if (!productIds.length) return new Map();

  const docs = await Product.find({ _id: { $in: productIds }, deletedAt: null })
    .select("_id imageUrl title")
    .lean();

  const map = new Map();
  for (const p of docs || []) {
    map.set(String(p._id), {
      imageUrl: String(p.imageUrl || ""),
      title: String(p.title || ""),
    });
  }
  return map;
}

async function buildProductMetaMapFromPayouts(payouts) {
  const ids = new Set();
  for (const p of payouts || []) {
    if (p?.product) ids.add(String(p.product));
  }
  const productIds = Array.from(ids);
  if (!productIds.length) return new Map();

  const docs = await Product.find({ _id: { $in: productIds }, deletedAt: null })
    .select("_id imageUrl title")
    .lean();

  const map = new Map();
  for (const p of docs || []) {
    map.set(String(p._id), {
      imageUrl: String(p.imageUrl || ""),
      title: String(p.title || ""),
    });
  }
  return map;
}

/* ============================================================
   GET /api/marketplace/profile/orders
============================================================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.auth.userId);
    const scope = String(req.query.scope || "purchases");
    const { from, to } = parseRange(req);
    const withStripe =
      String(req.query.withStripe || "")
        .toLowerCase()
        .trim() === "true" || String(req.query.withStripe || "") === "1";

    /* ------------------------- VENTES ------------------------- */
    if (scope === "sales") {
      const payoutQuery = { seller: userId };
      if (from || to) {
        payoutQuery.createdAt = {};
        if (from) payoutQuery.createdAt.$gte = from;
        if (to) payoutQuery.createdAt.$lte = to;
      }

      const payouts = await SellerPayout.find(payoutQuery)
        .sort({ createdAt: -1 })
        .lean();

      // ✅ map produits -> imageUrl/title
      const payoutProductMap = await buildProductMetaMapFromPayouts(payouts);

      if (payouts.length > 0) {
        const byOrder = new Map();
        for (const p of payouts) {
          const key = String(p.order);
          if (!byOrder.has(key)) {
            byOrder.set(key, {
              id: key,
              currency: String(p.currency || "usd").toUpperCase(),
              createdAt: null,
              paidAt: null,
              status: "succeeded",
              paymentReference: null,
              receiptUrl: null,
              hasReceipt: false,
              grossAmount: 0,
              commissionAmount: 0,
              netAmount: 0,
              items: [],
              appliedPromos: [],
            });
          }
          const bucket = byOrder.get(key);
          const qty = Math.max(1, Number(p.qty) || 1);
          const unit = Number(p.unitAmount || 0);
          const gross = Number(p.grossAmount || unit * qty);

          bucket.grossAmount += gross;
          bucket.commissionAmount += Number(p.commissionAmount || 0);
          bucket.netAmount += Number(p.netAmount || 0);

          const meta = payoutProductMap.get(String(p.product)) || null;

          bucket.items.push({
            product: String(p.product),
            qty,
            unitAmount: unit,
            grossAmount: gross,
            commissionAmount: Number(p.commissionAmount || 0),
            netAmount: Number(p.netAmount || 0),
            buyer: String(p.buyer || ""),
            shop: p.shop ? String(p.shop) : null,

            // ✅ AJOUTS UI
            imageUrl: meta?.imageUrl || "",
            title: meta?.title || "",

            promoCode: null,
            wasDiscounted: false,
            originalUnitAmount: null,
            finalUnitAmount: unit,
          });
        }

        const orderIds = Array.from(byOrder.keys());
        if (orderIds.length) {
          const metas = await Order.find({ _id: { $in: orderIds } })
            .select("_id status createdAt paidAt stripe paymentReference items")
            .lean();

          for (const m of metas) {
            const b = byOrder.get(String(m._id));
            if (b) {
              b.createdAt = toISO(m.createdAt);
              b.paidAt = m.paidAt ? toISO(m.paidAt) : null;
              b.status = m.status || b.status;
              b.paymentReference =
                (m.paymentReference && String(m.paymentReference)) ||
                (m.stripe && String(m.stripe.paymentIntentId || "")) ||
                null;

              b.receiptUrl = null;
              b.hasReceipt = ["succeeded", "processing"].includes(b.status);
              b.appliedPromos = buildAppliedPromos(m.items || []);

              if (withStripe) {
                await attachStripe(b, m.stripe, { withStripe: true });
              }
            }
          }
        }

        const items = Array.from(byOrder.values()).sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        );
        const stats = buildStats(items, { currencyKey: "currency" });
        res.set("Cache-Control", "no-store");
        return res
          .status(200)
          .json({ ok: true, data: { scope: "sales", items, stats } });
      }

      // Fallback sans payouts (reconstruit depuis Orders)
      const orderQuery = {
        deletedAt: null,
        status: { $in: ["succeeded", "processing"] },
        $or: [{ sellers: userId }, { "items.seller": userId }],
      };
      if (from || to) {
        orderQuery.createdAt = {};
        if (from) orderQuery.createdAt.$gte = from;
        if (to) orderQuery.createdAt.$lte = to;
      }

      const orders = await Order.find(orderQuery)
        .sort({ createdAt: -1, _id: -1 })
        .select(
          "_id user status currency createdAt paidAt items stripe paymentReference",
        )
        .lean();

      // ✅ map produits -> imageUrl/title (depuis items)
      const productMap = await buildProductMetaMapFromOrders(orders);

      const items = [];
      for (const o of orders) {
        const id = String(o._id);
        const currency = String(o.currency || "usd").toUpperCase();
        const bucket = {
          id,
          currency,
          createdAt: toISO(o.createdAt),
          paidAt: o.paidAt ? toISO(o.paidAt) : null,
          status: o.status || "succeeded",
          paymentReference:
            (o.paymentReference && String(o.paymentReference)) ||
            (o.stripe && String(o.stripe.paymentIntentId || "")) ||
            null,
          receiptUrl: null,
          hasReceipt: ["succeeded", "processing"].includes(o.status || ""),
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          items: [],
          appliedPromos: buildAppliedPromos(o.items || []),
        };

        for (const it of o.items || []) {
          if (String(it.seller || "") !== userId) continue;
          const qty = Math.max(1, Number(it.qty) || 1);
          const unit = Number(it.unitAmount || 0);
          const gross = unit * qty;
          const promoDecor = decorateItemPromo(it);

          const meta = productMap.get(String(it.product)) || null;

          bucket.grossAmount += gross;
          bucket.items.push({
            product: String(it.product || ""),
            qty,
            unitAmount: unit,
            grossAmount: gross,
            commissionAmount: null,
            netAmount: null,
            buyer: String(o.user || ""),
            shop: it.shop ? String(it.shop) : null,

            // ✅ AJOUTS UI
            imageUrl: meta?.imageUrl || "",
            title: String(it.title || meta?.title || ""),

            promoCode: promoDecor.promoCode,
            wasDiscounted: promoDecor.wasDiscounted,
            originalUnitAmount: promoDecor.originalUnitAmount,
            finalUnitAmount: promoDecor.finalUnitAmount,
          });
        }

        if (withStripe) {
          await attachStripe(bucket, o.stripe, { withStripe: true });
        }

        items.push(bucket);
      }

      items.sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || ""),
      );
      const stats = buildStats(items, { currencyKey: "currency" });
      res.set("Cache-Control", "no-store");
      return res
        .status(200)
        .json({ ok: true, data: { scope: "sales", items, stats } });
    }

    /* ------------------------- ACHATS ------------------------- */
    const purchasesQuery = { user: userId };
    if (from || to) {
      purchasesQuery.createdAt = {};
      if (from) purchasesQuery.createdAt.$gte = from;
      if (to) purchasesQuery.createdAt.$lte = to;
    }

    const rows = await Order.find(purchasesQuery)
      .sort({ createdAt: -1, _id: -1 })
      .select(
        "_id status currency totalAmount createdAt paidAt items sellers shops stripe paymentReference totalAmountCents",
      )
      .lean();

    // ✅ map produits -> imageUrl/title
    const productMap = await buildProductMetaMapFromOrders(rows);

    const items = [];
    for (const o of rows) {
      const hasReceipt = ["succeeded", "processing"].includes(o.status || "");
      const order = {
        id: String(o._id),
        status: o.status || "requires_payment",
        currency: String(o.currency || "usd").toUpperCase(),
        totalAmount: Number(o.totalAmount || 0),
        createdAt: toISO(o.createdAt),
        paidAt: o.paidAt ? toISO(o.paidAt) : null,
        paymentReference:
          (o.paymentReference && String(o.paymentReference)) ||
          (o.stripe && String(o.stripe.paymentIntentId || "")) ||
          null,
        receiptUrl: null,
        hasReceipt,
        sellers: Array.isArray(o.sellers) ? o.sellers.map(String) : [],
        shops: Array.isArray(o.shops) ? o.shops.map((s) => String(s)) : [],
        appliedPromos: buildAppliedPromos(o.items || []),
        items: Array.isArray(o.items)
          ? o.items.map((it) => {
              const promoDecor = decorateItemPromo(it);
              const meta = productMap.get(String(it.product)) || null;

              return {
                product: String(it.product || ""),
                title: String(it.title || meta?.title || ""),
                unitAmount: Number(it.unitAmount || 0),
                qty: Math.max(1, Number(it.qty) || 1),
                seller: it.seller ? String(it.seller) : "",
                shop: it.shop ? String(it.shop) : null,

                // ✅ AJOUTS UI
                imageUrl: meta?.imageUrl || "",

                promoCode: promoDecor.promoCode,
                wasDiscounted: promoDecor.wasDiscounted,
                originalUnitAmount: promoDecor.originalUnitAmount,
                finalUnitAmount: promoDecor.finalUnitAmount,
              };
            })
          : [],
      };

      if (withStripe) {
        await attachStripe(order, o.stripe, { withStripe: true });
      }

      items.push(order);
    }

    const stats = buildStats(
      items.map((i) => ({
        ...i,
        grossAmount: i.totalAmount,
        commissionAmount: 0,
        netAmount: i.totalAmount,
      })),
      { currencyKey: "currency" },
    );

    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .json({ ok: true, data: { scope: "purchases", items, stats } });
  } catch (e) {
    console.error("[ORDERS] LIST ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des commandes impossible" });
  }
});

/* ============================================================
   GET /api/marketplace/profile/orders/:id/receipt
   🔒 Reçu “maison” FullMargin (HTML imprimable → PDF)
============================================================ */
router.get("/:id/receipt", requireAuth, async (req, res) => {
  try {
    const userId = String(req.auth.userId);
    const scope = String(req.query.scope || "purchases");
    const id = String(req.params.id || "");

    let order = null;
    let role = "buyer"; // ou "seller"

    if (scope === "sales") {
      const o = await Order.findOne({
        _id: id,
        deletedAt: null,
        status: { $in: ["succeeded", "processing"] },
        $or: [{ sellers: userId }, { "items.seller": userId }],
      })
        .select(
          "_id user status currency createdAt paidAt items sellers shops totalAmount totalAmountCents paymentReference",
        )
        .lean();

      if (!o) {
        return res
          .status(404)
          .send("Commande introuvable ou vous n'êtes pas vendeur dessus.");
      }
      order = o;
      role = "seller";
    } else {
      const o = await Order.findOne({
        _id: id,
        user: userId,
        status: { $in: ["succeeded", "processing"] },
      })
        .select(
          "_id user status currency createdAt paidAt items sellers shops totalAmount totalAmountCents paymentReference",
        )
        .lean();

      if (!o) {
        return res
          .status(404)
          .send("Commande introuvable ou non payée pour cet utilisateur.");
      }
      order = o;
      role = "buyer";
    }

    const currency = String(order.currency || "usd").toUpperCase();
    const ref = order.paymentReference || `FM-${String(order._id).slice(-8)}`;
    const maskedRef =
      ref.length > 6
        ? `${ref.slice(0, 3)}***${ref.slice(-3)}`
        : ref.replace(/.(?=.)/g, "*");

    const createdAt = toISO(order.createdAt);
    const paidAt = order.paidAt ? toISO(order.paidAt) : null;

    const items = (order.items || []).map((it) => ({
      title: String(
        it.title || `Produit ${String(it.product || "").slice(-6)}`,
      ),
      qty: Math.max(1, Number(it.qty) || 1),
      unitAmount: Number(it.unitAmount || 0),
    }));

    const total = Number(order.totalAmount || 0);
    const isSuccess = ["succeeded", "processing"].includes(order.status || "");

    if (!isSuccess) {
      return res
        .status(400)
        .send("Cette commande n'est pas encore payée : reçu indisponible.");
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu de paiement – FullMargin</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 40px;
      color: #111827;
      background-color: #f9fafb;
    }
    .card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid rgba(15,23,42,0.08);
      padding: 24px 28px;
      box-shadow: 0 18px 45px rgba(15,23,42,0.08);
    }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color: #6b7280; font-size: 13px; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-top: 16px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid rgba(16,185,129,0.35);
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      font-size: 13px;
    }
    th, td { padding: 8px 6px; text-align: left; }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) td { background: #f9fafb; }
    .total-row td {
      border-top: 1px solid #e5e7eb;
      font-weight: 600;
      font-size: 14px;
    }
    .right { text-align: right; }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
    }
    .tag {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 11px;
    }
    @media print {
      body { background: #ffffff; margin: 0; }
      .card { box-shadow: none; border-radius: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="row">
      <div>
        <h1>Reçu de paiement – Marketplace</h1>
        <div class="muted">Commande #${String(order._id).slice(-8)}</div>
        <div class="muted" style="margin-top:4px;">
          Rôle : ${
            role === "seller" ? "Vendeur" : "Acheteur"
          } sur cette transaction
        </div>
      </div>
      <div class="right">
        <div class="badge">Paiement confirmé</div>
        <div class="muted" style="margin-top:8px;">
          Devise : <strong>${currency}</strong><br/>
          Référence paiement : <strong>${maskedRef}</strong>
        </div>
      </div>
    </div>

    <div class="row" style="margin-top:20px;">
      <div>
        <div class="muted">Date de création</div>
        <div><strong>${createdAt}</strong></div>
      </div>
      <div class="right">
        <div class="muted">Date de paiement</div>
        <div><strong>${paidAt || "—"}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th>Quantité</th>
          <th class="right">Prix unitaire</th>
          <th class="right">Sous-total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((it) => {
            const subtotal = it.qty * it.unitAmount;
            return `<tr>
              <td>${it.title}</td>
              <td>${it.qty}</td>
              <td class="right">${it.unitAmount.toFixed(2)} ${currency}</td>
              <td class="right">${subtotal.toFixed(2)} ${currency}</td>
            </tr>`;
          })
          .join("")}
        <tr class="total-row">
          <td colspan="3" class="right">Total payé</td>
          <td class="right">${total.toFixed(2)} ${currency}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div style="margin-bottom:6px;">
        Ce reçu est généré par <strong>FullMargin</strong> et ne contient
        pas les informations sensibles liées à votre moyen de paiement.
      </div>
      <div style="margin-bottom:4px;">
        <span class="tag">Usage interne & justificatif simple</span>
      </div>
      <div>
        Pour un justificatif comptable détaillé, veuillez vous référer
        aux relevés fournis par votre établissement bancaire / opérateur.
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (e) {
    console.error("[ORDERS] RECEIPT ERROR:", e?.stack || e);
    return res
      .status(500)
      .send("Impossible de générer le reçu pour cette commande.");
  }
});

/* ============================================================
   GET /api/marketplace/profile/orders/:id
============================================================ */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.auth.userId);
    const scope = String(req.query.scope || "purchases");
    const id = String(req.params.id || "");
    const withStripe =
      String(req.query.withStripe || "")
        .toLowerCase()
        .trim() === "true" || String(req.query.withStripe || "") === "1";

    /* ------------------------- VENTES (détail) ------------------------- */
    if (scope === "sales") {
      const payouts = await SellerPayout.find({
        order: id,
        seller: userId,
      }).lean();

      // ✅ map produits -> imageUrl/title (payouts)
      const payoutProductMap = await buildProductMetaMapFromPayouts(payouts);

      if (payouts.length > 0) {
        const meta =
          (await Order.findOne({ _id: id })
            .select(
              "_id status currency createdAt paidAt stripe paymentReference items",
            )
            .lean()) || {};

        const hasReceipt = ["succeeded", "processing"].includes(
          meta.status || "",
        );

        const order = {
          id,
          status: meta.status || "succeeded",
          currency: String(meta.currency || "usd").toUpperCase(),
          createdAt: meta.createdAt ? toISO(meta.createdAt) : "",
          paidAt: meta.paidAt ? toISO(meta.paidAt) : null,
          paymentReference:
            (meta.paymentReference && String(meta.paymentReference)) ||
            (meta.stripe && String(meta.stripe.paymentIntentId || "")) ||
            null,
          receiptUrl: null,
          hasReceipt,
          appliedPromos: buildAppliedPromos(meta.items || []),
          grossAmount: payouts.reduce(
            (s, p) => s + Number(p.grossAmount || 0),
            0,
          ),
          commissionAmount: payouts.reduce(
            (s, p) => s + Number(p.commissionAmount || 0),
            0,
          ),
          netAmount: payouts.reduce((s, p) => s + Number(p.netAmount || 0), 0),
          items: payouts.map((p) => {
            const metaP = payoutProductMap.get(String(p.product)) || null;
            return {
              product: String(p.product),
              qty: Math.max(1, Number(p.qty) || 1),
              unitAmount: Number(p.unitAmount || 0),
              grossAmount: Number(p.grossAmount || 0),
              commissionAmount: Number(p.commissionAmount || 0),
              netAmount: Number(p.netAmount || 0),
              buyer: String(p.buyer || ""),
              shop: p.shop ? String(p.shop) : null,

              // ✅ AJOUTS UI
              imageUrl: metaP?.imageUrl || "",
              title: metaP?.title || "",

              promoCode: null,
              wasDiscounted: false,
              originalUnitAmount: null,
              finalUnitAmount: Number(p.unitAmount || 0),
            };
          }),
        };

        if (withStripe) {
          await attachStripe(order, meta.stripe, { withStripe: true });
        }

        res.set("Cache-Control", "no-store");
        return res
          .status(200)
          .json({ ok: true, data: { scope: "sales", order } });
      }

      const o = await Order.findOne({
        _id: id,
        deletedAt: null,
        status: { $in: ["succeeded", "processing"] },
        $or: [{ sellers: userId }, { "items.seller": userId }],
      })
        .select(
          "_id user status currency createdAt paidAt items stripe paymentReference totalAmount totalAmountCents",
        )
        .lean();

      if (!o) {
        return res
          .status(404)
          .json({ ok: false, error: "Commande introuvable pour vos ventes" });
      }

      // ✅ map produits -> imageUrl/title (order items)
      const productMap = await buildProductMetaMapFromOrders([o]);

      const lines = [];
      let grossTotal = 0;
      for (const it of o.items || []) {
        if (String(it.seller || "") !== userId) continue;
        const qty = Math.max(1, Number(it.qty) || 1);
        const unit = Number(it.unitAmount || 0);
        const gross = unit * qty;
        grossTotal += gross;
        const promoDecor = decorateItemPromo(it);
        const meta = productMap.get(String(it.product)) || null;

        lines.push({
          product: String(it.product || ""),
          qty,
          unitAmount: unit,
          grossAmount: gross,
          commissionAmount: null,
          netAmount: null,
          buyer: String(o.user || ""),
          shop: it.shop ? String(it.shop) : null,

          // ✅ AJOUTS UI
          imageUrl: meta?.imageUrl || "",
          title: String(it.title || meta?.title || ""),

          promoCode: promoDecor.promoCode,
          wasDiscounted: promoDecor.wasDiscounted,
          originalUnitAmount: promoDecor.originalUnitAmount,
          finalUnitAmount: promoDecor.finalUnitAmount,
        });
      }

      const hasReceipt = ["succeeded", "processing"].includes(o.status || "");

      const order = {
        id: String(o._id),
        status: o.status || "succeeded",
        currency: String(o.currency || "usd").toUpperCase(),
        createdAt: toISO(o.createdAt),
        paidAt: o.paidAt ? toISO(o.paidAt) : null,
        paymentReference:
          (o.paymentReference && String(o.paymentReference)) ||
          (o.stripe && String(o.stripe.paymentIntentId || "")) ||
          null,
        receiptUrl: null,
        hasReceipt,
        appliedPromos: buildAppliedPromos(o.items || []),
        grossAmount: grossTotal,
        commissionAmount: null,
        netAmount: null,
        items: lines,
      };

      if (withStripe) {
        await attachStripe(order, o.stripe, { withStripe: true });
      }

      res.set("Cache-Control", "no-store");
      return res
        .status(200)
        .json({ ok: true, data: { scope: "sales", order } });
    }

    /* ------------------------- ACHATS (détail) ------------------------- */
    const o = await Order.findOne({ _id: id, user: userId })
      .select(
        "_id status currency totalAmount totalAmountCents createdAt paidAt items stripe sellers shops paymentReference",
      )
      .lean();

    if (!o) {
      return res.status(404).json({ ok: false, error: "Commande introuvable" });
    }

    // ✅ map produits -> imageUrl/title
    const productMap = await buildProductMetaMapFromOrders([o]);

    const hasReceipt = ["succeeded", "processing"].includes(o.status || "");

    const order = {
      id: String(o._id),
      status: o.status || "requires_payment",
      currency: String(o.currency || "usd").toUpperCase(),
      totalAmount: Number(o.totalAmount || 0),
      totalAmountCents: Number(o.totalAmountCents || 0),
      createdAt: toISO(o.createdAt),
      paidAt: o.paidAt ? toISO(o.paidAt) : null,
      paymentReference:
        (o.paymentReference && String(o.paymentReference)) ||
        (o.stripe && String(o.stripe.paymentIntentId || "")) ||
        null,
      receiptUrl: null,
      hasReceipt,
      sellers: Array.isArray(o.sellers) ? o.sellers.map(String) : [],
      shops: Array.isArray(o.shops) ? o.shops.map((s) => String(s)) : [],
      appliedPromos: buildAppliedPromos(o.items || []),
      items: Array.isArray(o.items)
        ? o.items.map((it) => {
            const promoDecor = decorateItemPromo(it);
            const meta = productMap.get(String(it.product)) || null;
            return {
              product: String(it.product || ""),
              title: String(it.title || meta?.title || ""),
              unitAmount: Number(it.unitAmount || 0),
              qty: Math.max(1, Number(it.qty) || 1),
              seller: it.seller ? String(it.seller) : "",
              shop: it.shop ? String(it.shop) : null,

              // ✅ AJOUT UI
              imageUrl: meta?.imageUrl || "",

              promoCode: promoDecor.promoCode,
              wasDiscounted: promoDecor.wasDiscounted,
              originalUnitAmount: promoDecor.originalUnitAmount,
              finalUnitAmount: promoDecor.finalUnitAmount,
            };
          })
        : [],
      stripe: null,
    };

    if (withStripe) {
      await attachStripe(order, o.stripe, { withStripe: true });
    }

    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .json({ ok: true, data: { scope: "purchases", order } });
  } catch (e) {
    console.error("[ORDERS] DETAIL ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement de la commande impossible" });
  }
});

module.exports = router;
