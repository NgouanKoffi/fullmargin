// backend/src/payments/payment.types.js

/**
 * @typedef PaymentEvent
 * @property {"stripe"|"manual_crypto"} provider
 * @property {"succeeded"|"approved"|"failed"|"canceled"|"pending"} type
 * @property {"course"|"marketplace"|"fm-metrix"} feature
 * @property {string} transactionId
 * @property {number} amount
 * @property {object} metadata
 * @property {any} raw
 */

module.exports = {};
