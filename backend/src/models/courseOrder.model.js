// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\courseOrder.model.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/* ---------- Stripe enrichi (mêmes sous-schemas que ta marketplace) ---------- */
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

/* ---------- Order “cours” (une seule ligne, 1 cours) ---------- */
const CourseOrderSchema = new Schema(
  {
    // Acheteur
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Course payée
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    courseTitle: { type: String, required: true },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // formateur

    currency: { type: String, default: "usd" },
    unitAmount: { type: Number, required: true, min: 0 }, // dollars
    unitAmountCents: { type: Number, required: true, min: 0 }, // cents

    status: {
      type: String,
      enum: ["requires_payment", "succeeded", "canceled", "failed"],
      default: "requires_payment",
      index: true,
    },

    stripe: { type: StripeInfoSchema, default: () => ({}) },
    paidAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CourseOrderSchema.index(
  { user: 1, createdAt: -1 },
  { name: "course_order_user_created_desc" },
);
CourseOrderSchema.index(
  { seller: 1, createdAt: -1 },
  { name: "course_order_seller_created_desc" },
);
CourseOrderSchema.index({ "stripe.paymentIntentId": 1 }, { unique: false });
CourseOrderSchema.index({ "stripe.checkoutSessionId": 1 }, { unique: false });

module.exports = model("CourseOrder", CourseOrderSchema);
