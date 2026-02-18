// backend/src/models/order.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/* --------- Promo appliquée sur la ligne --------- */
const OrderItemPromoSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    scope: {
      type: String,
      enum: ["global", "category", "product", "shop"],
      required: true,
    },
    type: { type: String, enum: ["percent", "amount"], required: true },
    value: { type: Number, min: 1, required: true },
    discountUnit: { type: Number, min: 0, required: true },
    finalUnit: { type: Number, min: 0, required: true },
  },
  { _id: false },
);

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    unitAmount: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },
    promo: { type: OrderItemPromoSchema, default: undefined },
  },
  { _id: false },
);

/* --------- Stripe meta enrichi --------- */
const StripeAmountsSchema = new Schema(
  {
    currency: { type: String, default: "usd" },
    amount: { type: Number, default: null },
    amountCents: { type: Number, default: null },
    fee: { type: Number, default: null },
    feeCents: { type: Number, default: null },
    net: { type: Number, default: null },
    netCents: { type: Number, default: null },
  },
  { _id: false },
);

const StripePaymentMethodSchema = new Schema(
  {
    type: { type: String, default: null },
    brand: { type: String, default: null },
    last4: { type: String, default: null },
    expMonth: { type: Number, default: null },
    expYear: { type: Number, default: null },
  },
  { _id: false },
);

const StripeInfoSchema = new Schema(
  {
    paymentIntentId: { type: String, default: "" },
    clientSecret: { type: String, default: "" },
    checkoutSessionId: { type: String, default: "" },
    chargeId: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    paymentMethod: { type: StripePaymentMethodSchema, default: () => ({}) },
    amounts: { type: StripeAmountsSchema, default: () => ({}) },
  },
  { _id: false },
);

/* --------- Crypto (validation manuelle admin) --------- */
const CryptoInfoSchema = new Schema(
  {
    network: { type: String, default: "" },
    txHash: { type: String, default: "" },
    address: { type: String, default: "" },
    note: { type: String, default: "" },
    validatedAt: { type: Date, default: null },
    validatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "" },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    sellers: [
      { type: Schema.Types.ObjectId, ref: "User", index: true, default: [] },
    ],
    shops: [
      { type: Schema.Types.ObjectId, ref: "Shop", index: true, default: [] },
    ],
    currency: { type: String, default: "usd" },
    totalAmount: { type: Number, required: true, min: 0 },
    totalAmountCents: { type: Number, required: true, min: 0 },

    // ✅ C'EST ICI LA CLÉ DU PROBLÈME :
    // Ce champ permet de verrouiller le traitement (emails, commissions, etc.)
    // pour qu'il ne s'exécute qu'une seule fois.
    promoApplied: { type: Boolean, default: false },

    provider: { type: String, default: "stripe", index: true },
    paymentReference: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: ["requires_payment", "succeeded", "canceled", "failed"],
      default: "requires_payment",
      index: true,
    },
    stripe: { type: StripeInfoSchema, default: () => ({}) },
    crypto: { type: CryptoInfoSchema, default: () => ({}) },
    paidAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

OrderSchema.index(
  { user: 1, createdAt: -1 },
  { name: "ord_user_created_desc" },
);
OrderSchema.index({ "items.product": 1 }, { name: "ord_items_product" });
OrderSchema.index({ "items.seller": 1 }, { name: "ord_items_seller" });
OrderSchema.index(
  { "items.promo.code": 1, createdAt: -1 },
  { name: "ord_items_promo_code_created" },
);

module.exports = model("Order", OrderSchema);
