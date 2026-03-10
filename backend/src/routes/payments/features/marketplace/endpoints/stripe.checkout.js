// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\marketplace\endpoints\stripe.checkout.js
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const Product = require("../../../../../models/product.model");
const Order = require("../../../../../models/order.model");

const { toCents } = require("../_money");
const { validatePromoForProduct, applyPromoToUnit } = require("../promo");

const CURRENCY = (
  process.env.STRIPE_DEFAULT_CURRENCY ||
  process.env.CURRENCY ||
  "usd"
).toLowerCase();

const PUBLIC_WEB =
  process.env.PUBLIC_WEB_BASE_URL ||
  process.env.APP_URL ||
  "http://localhost:5173";

module.exports = async function stripeCheckout(req, res) {
  try {
    const userId = req.auth.userId;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length)
      return res.status(400).json({ ok: false, error: "Panier vide" });

    const ids = items.map((i) => String(i.id)).filter(Boolean);
    const qtyMap = new Map(
      items.map((i) => [String(i.id), Math.max(1, Number(i.qty) || 1)])
    );
    const promoMap = new Map(
      items
        .filter((i) => i.promoCode)
        .map((i) => [String(i.id), String(i.promoCode).trim().toUpperCase()])
    );

    const rows = await Product.find({
      _id: { $in: ids },
      status: "published",
      deletedAt: null,
    })
      .select("_id title pricing user shop category")
      .lean();

    if (!rows.length) {
      return res
        .status(400)
        .json({ ok: false, error: "Aucun produit payable" });
    }

    const owned = rows.filter((p) => String(p.user) === String(userId));
    if (owned.length > 0) {
      const names = owned.map((p) => p.title).filter(Boolean);
      const msg =
        names.length > 0
          ? `Vous ne pouvez pas acheter vos propres produits : ${names.join(
              ", "
            )}.`
          : "Vous ne pouvez pas acheter vos propres produits.";
      return res.status(400).send(msg);
    }

    const orderItems = [];
    for (const p of rows) {
      const qty = qtyMap.get(String(p._id)) || 1;
      const unit = Number(p.pricing?.amount || 0);

      let promoInfo = null;
      let finalUnit = unit;

      const requestedCode = promoMap.get(String(p._id)) || null;
      if (requestedCode) {
        const { promo, error: promoErr } = await validatePromoForProduct({
          code: requestedCode,
          product: p,
        });
        if (promoErr)
          return res.status(400).json({ ok: false, error: promoErr });

        const { finalUnit: fu, discountUnit } = applyPromoToUnit({
          unitAmount: unit,
          promo,
        });
        finalUnit = fu;
        promoInfo = {
          code: promo.code,
          scope: promo.scope,
          type: promo.type,
          value: promo.value,
          discountUnit,
          finalUnit,
        };
      }

      orderItems.push({
        product: p._id,
        title: p.title,
        unitAmount: finalUnit,
        qty,
        seller: p.user,
        shop: p.shop || null,
        promo: promoInfo || undefined,
      });
    }

    const sellerSet = new Set(orderItems.map((it) => String(it.seller)));
    const shopSet = new Set(
      orderItems.map((it) => (it.shop ? String(it.shop) : null)).filter(Boolean)
    );

    const total = orderItems.reduce((s, it) => s + it.unitAmount * it.qty, 0);
    const totalCents = toCents(total);
    if (totalCents <= 0)
      return res.status(400).json({ ok: false, error: "Montant invalide" });

    const order = await Order.create({
      user: userId,
      items: orderItems,
      sellers: Array.from(sellerSet),
      shops: Array.from(shopSet),
      currency: CURRENCY,
      totalAmount: total,
      totalAmountCents: totalCents,
      status: "requires_payment",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: orderItems.map((it) => ({
        price_data: {
          currency: CURRENCY,
          product_data: { name: it.title },
          unit_amount: toCents(it.unitAmount),
        },
        quantity: it.qty,
      })),
      success_url: `${PUBLIC_WEB}/marketplace/dashboard?tab=orders&ok=1&order=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_WEB}/marketplace/checkout?cancel=1&order=${order._id}`,
      metadata: { orderId: String(order._id), userId: String(userId) },
    });

    order.stripe = {
      ...(order.stripe || {}),
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || undefined,
    };
    await order.save();

    return res.status(200).json({ ok: true, data: { url: session.url } });
  } catch (e) {
    console.error("[STRIPE] checkout error:", e?.stack || e);
    return res.status(500).json({ ok: false, error: "Checkout impossible" });
  }
};
