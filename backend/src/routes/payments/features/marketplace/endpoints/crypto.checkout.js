// backend/src/routes/payments/features/marketplace/endpoints/crypto.checkout.js
const Product = require("../../../../../models/product.model");
const Order = require("../../../../../models/order.model");

const { toCents, centsToUnit } = require("../_money");
const { validatePromoForProduct, applyPromoToUnit } = require("../promo");

const CURRENCY = (
  process.env.STRIPE_DEFAULT_CURRENCY ||
  process.env.CURRENCY ||
  "usd"
)
  .toLowerCase()
  .trim();

module.exports = async function cryptoMarketplaceCheckout(req, res) {
  try {
    const userId = req.auth.userId;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    // 1. Validation du panier
    if (!items.length)
      return res.status(400).json({ ok: false, error: "Panier vide" });

    const ids = items.map((i) => String(i.id)).filter(Boolean);
    const qtyMap = new Map(
      items.map((i) => [String(i.id), Math.max(1, Number(i.qty) || 1)]),
    );
    const promoMap = new Map(
      items
        .filter((i) => i.promoCode)
        .map((i) => [String(i.id), String(i.promoCode).trim().toUpperCase()]),
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

    // Empêcher l'achat de ses propres produits
    const owned = rows.filter((p) => String(p.user) === String(userId));
    if (owned.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Vous ne pouvez pas acheter vos propres produits.",
      });
    }

    // 2. Calcul des prix et promos
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

    // 3. Totaux
    const sellerSet = new Set(orderItems.map((it) => String(it.seller)));
    const shopSet = new Set(
      orderItems
        .map((it) => (it.shop ? String(it.shop) : null))
        .filter(Boolean),
    );

    const total = orderItems.reduce((s, it) => s + it.unitAmount * it.qty, 0);
    const totalCents = toCents(total);
    if (totalCents <= 0)
      return res.status(400).json({ ok: false, error: "Montant invalide" });

    // 4. Génération de la Référence Unique (Pour WhatsApp)
    const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. Création de la Commande
    const order = await Order.create({
      user: userId,
      items: orderItems,
      sellers: Array.from(sellerSet),
      shops: Array.from(shopSet),
      currency: CURRENCY,
      totalAmount: total,
      totalAmountCents: totalCents,
      status: "requires_payment", // En attente de validation admin

      // ✅ Stockage des infos Crypto Manuelle
      crypto: {
        provider: "manual_crypto",
        reference: reference,
        network: req.body?.network || "USDT",
        customerEmail: req.body?.customer_email || null,
        status: "pending_verification",
      },
    });

    // 6. Réponse au frontend
    return res.status(200).json({
      ok: true,
      data: {
        orderId: order._id,
        reference: reference, // La REF à afficher sur WhatsApp
        manual: true,
        amount: total,
        currency: CURRENCY,
      },
    });
  } catch (e) {
    console.error("[CRYPTO][MARKETPLACE] checkout error:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Création de commande impossible" });
  }
};
