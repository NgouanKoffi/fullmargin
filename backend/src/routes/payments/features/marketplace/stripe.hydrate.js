// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\payments\features\marketplace\stripe.hydrate.js
const { centsToUnit } = require("./_money");

/* ------------------------------------------------------------------
   Mapper Stripe -> Order (session/payment_intent/charge/bt)
------------------------------------------------------------------- */
async function hydrateOrderFromStripe({ order, session, pi, stripe }) {
  try {
    if (!pi) {
      const paymentIntentId =
        (typeof session?.payment_intent === "string"
          ? session.payment_intent
          : session?.payment_intent?.id) || order?.stripe?.paymentIntentId;

      if (paymentIntentId) {
        pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: [
            "latest_charge",
            "latest_charge.balance_transaction",
            "payment_method",
          ],
        });
      }
    }

    const customerEmail =
      session?.customer_details?.email ||
      session?.customer_email ||
      order?.stripe?.customerEmail ||
      null;

    const paymentIntentId = pi?.id || order?.stripe?.paymentIntentId || null;
    const charge =
      pi?.latest_charge && typeof pi.latest_charge === "object"
        ? pi.latest_charge
        : undefined;

    const chargeId =
      (typeof pi?.latest_charge === "string" ? pi.latest_charge : charge?.id) ||
      order?.stripe?.chargeId ||
      null;

    const receiptUrl =
      charge?.receipt_url ||
      (charge?.charges?.data?.[0]?.receipt_url ?? null) ||
      order?.stripe?.receiptUrl ||
      null;

    const paidAtStripe =
      charge?.created != null ? new Date(charge.created * 1000) : null;

    const pm =
      pi?.payment_method && typeof pi.payment_method === "object"
        ? pi.payment_method
        : null;
    const pmCard = pm?.card || {};
    const paymentMethod = pm
      ? {
          type: pm.type || null,
          brand: pmCard.brand || null,
          last4: pmCard.last4 || null,
          expMonth: pmCard.exp_month || null,
          expYear: pmCard.exp_year || null,
        }
      : order?.stripe?.paymentMethod || null;

    const bt =
      charge?.balance_transaction &&
      typeof charge.balance_transaction === "object"
        ? charge.balance_transaction
        : null;

    const currency = (
      bt?.currency ||
      pi?.currency ||
      order.currency ||
      "usd"
    ).toLowerCase();

    const amountCents =
      typeof bt?.amount === "number"
        ? bt.amount
        : typeof pi?.amount_received === "number"
        ? pi.amount_received
        : order.totalAmountCents;

    const feeCents = typeof bt?.fee === "number" ? bt.fee : null;
    const netCents =
      typeof bt?.net === "number"
        ? bt.net
        : amountCents != null && feeCents != null
        ? amountCents - feeCents
        : null;

    order.stripe = {
      ...(order.stripe || {}),
      checkoutSessionId: session?.id || order?.stripe?.checkoutSessionId || "",
      paymentIntentId: paymentIntentId || order?.stripe?.paymentIntentId || "",
      chargeId: chargeId || order?.stripe?.chargeId || "",
      receiptUrl: receiptUrl || order?.stripe?.receiptUrl || "",
      customerEmail: customerEmail || order?.stripe?.customerEmail || "",
      paymentMethod: paymentMethod || order?.stripe?.paymentMethod || undefined,
      amounts: {
        currency,
        amount:
          typeof amountCents === "number"
            ? centsToUnit(amountCents)
            : order?.stripe?.amounts?.amount || null,
        amountCents: amountCents ?? order?.stripe?.amounts?.amountCents ?? null,
        fee:
          typeof feeCents === "number"
            ? centsToUnit(feeCents)
            : order?.stripe?.amounts?.fee || null,
        feeCents: feeCents ?? order?.stripe?.amounts?.feeCents ?? null,
        net:
          typeof netCents === "number"
            ? centsToUnit(netCents)
            : order?.stripe?.amounts?.net || null,
        netCents: netCents ?? order?.stripe?.amounts?.netCents ?? null,
      },
    };

    if (pi?.status === "succeeded" || session?.payment_status === "paid") {
      order.status = "succeeded";
      order.paidAt = order.paidAt || paidAtStripe || new Date();
    } else if (session?.status === "expired" || pi?.status === "canceled") {
      order.status = "canceled";
    } else if (!["succeeded", "failed", "canceled"].includes(order.status)) {
      order.status = "requires_payment";
    }
  } catch (e) {
    console.warn("[STRIPE] hydrateOrderFromStripe error:", e?.message || e);
  }
}

module.exports = { hydrateOrderFromStripe };
