async function hydrateOrderFromFedapay({ order, transaction }) {
  try {
    if (!transaction) return;

    const rawAmount =
      Number(transaction.amount_debited) ||
      Number(transaction.amount_transferred) ||
      Number(transaction.amount) ||
      0;

    const currencyIso =
      (transaction.currency && transaction.currency.iso) ||
      transaction.currency_code ||
      "xof";

    const rawFees =
      typeof transaction.fees === "number" ? Number(transaction.fees) : null;

    const netAmount =
      rawAmount && rawFees != null ? rawAmount - rawFees : rawAmount || null;

    const md = transaction.metadata || {};
    const paidCustomer = md.paid_customer || null;

    const customerEmail =
      (paidCustomer && paidCustomer.email) || order.stripe?.customerEmail || "";

    const receiptUrl =
      transaction.receipt_url || order.stripe?.receiptUrl || "";

    const paidAt =
      order.paidAt ||
      (transaction.approved_at ? new Date(transaction.approved_at) : null) ||
      new Date();

    if (rawAmount > 0) {
      order.currency = currencyIso.toLowerCase();
      order.totalAmount = rawAmount;
      order.totalAmountCents = rawAmount;
    }

    order.status = "succeeded";
    order.paidAt = paidAt;

    const prevStripe = order.stripe || {};

    order.stripe = {
      ...prevStripe,
      receiptUrl,
      customerEmail,
      paymentMethod: {
        ...(prevStripe.paymentMethod || {}),
        type: transaction.mode || "wallet",
        brand: "FedaPay",
        last4: prevStripe.paymentMethod?.last4 || null,
        expMonth: prevStripe.paymentMethod?.expMonth || null,
        expYear: prevStripe.paymentMethod?.expYear || null,
      },
      amounts: {
        currency: currencyIso.toLowerCase(),
        amount: rawAmount || prevStripe.amounts?.amount || null,
        amountCents: rawAmount || prevStripe.amounts?.amountCents || null,
        fee: rawFees != null ? rawFees : prevStripe.amounts?.fee || null,
        feeCents:
          rawFees != null ? rawFees : prevStripe.amounts?.feeCents || null,
        net: netAmount != null ? netAmount : prevStripe.amounts?.net || null,
        netCents:
          netAmount != null ? netAmount : prevStripe.amounts?.netCents || null,
      },
    };
  } catch (e) {
    console.warn(
      "[FEDAPAY][MARKETPLACE] hydrateOrderFromFedapay error:",
      e?.message || e
    );
  }
}

module.exports = { hydrateOrderFromFedapay };
