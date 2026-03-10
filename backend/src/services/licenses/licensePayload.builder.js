// backend/src/services/licenses/licensePayload.builder.js

function normalizeUnit(unit) {
  const u = String(unit || "")
    .toLowerCase()
    .trim();
  if (["days", "day", "jours", "jour"].includes(u)) return "days";
  if (["months", "month", "mois"].includes(u)) return "months";
  if (["years", "year", "ans", "an"].includes(u)) return "years";
  return "months";
}

// Durée "très longue" envoyée au provider pour simuler illimité (100 ans)
const LIFETIME_MONTHS = 1200;

function computeDurationFromProduct(product) {
  const pricing = product?.pricing || {};

  if (pricing.mode === "subscription") {
    const unit = pricing.interval === "year" ? "years" : "months";
    return { duration: 1, unit, isLifetime: false };
  }

  // one_time = lifetime
  return { duration: LIFETIME_MONTHS, unit: "months", isLifetime: true };
}

function splitFullName(fullName) {
  const s = String(fullName || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return { prenom: "", nom: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function buildIssuePayload({ user, product, profileExtra, phone }) {
  const { duration, unit, isLifetime } = computeDurationFromProduct(product);

  // ✅ User.fullName -> prenom/nom
  const { prenom, nom } = splitFullName(user?.fullName);

  // ✅ téléphone: ProfileExtra.phone sinon phone (déjà fallback "22")
  const telephone =
    String(profileExtra?.phone || "").trim() || String(phone || "").trim();

  const email = user?.email || "";

  return {
    nom,
    prenom,
    email,
    telephone,

    duration,
    unit: normalizeUnit(unit),

    robot_name: product?.title || "",
    key_type: "robot",

    lifetime: !!isLifetime,
    pricing_mode: product?.pricing?.mode || "one_time",
  };
}

function buildRenewPayload({ licenseKey, duration, unit, reactivate = true }) {
  return {
    license_key: String(licenseKey || "").trim(),
    duration: Number(duration),
    unit: normalizeUnit(unit),
    reactivate: !!reactivate,
  };
}

module.exports = {
  buildIssuePayload,
  buildRenewPayload,
  computeDurationFromProduct, // ✅ NEW
  normalizeUnit, // (optionnel mais utile)
};
