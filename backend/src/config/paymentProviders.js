// backend/src/config/paymentProviders.js

const providers = {
  stripe: {
    key: "stripe",
    label: "Carte bancaire (Stripe)",
    enabled: !!process.env.STRIPE_SECRET_KEY,
    type: "card",
  },
  fedapay: {
    key: "fedapay",
    label: "Mobile money (FedaPay)",
    enabled: !!process.env.FEDAPAY_SECRET_KEY,
    type: "mobile_money",
  },
  // plus tard : "paydunya", "paypal", etc.
};

function getEnabledProviders() {
  return Object.values(providers).filter((p) => p.enabled);
}

function isProviderEnabled(key) {
  const p = providers[key];
  return !!(p && p.enabled);
}

module.exports = {
  providers,
  getEnabledProviders,
  isProviderEnabled,
};
