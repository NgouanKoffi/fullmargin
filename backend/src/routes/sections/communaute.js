// backend/src/routes/sections/communaute.js

module.exports = (router) => {
  // communautés (liste + CRUD)
  try {
    router.use("/communaute/communities", require("../communaute/communities"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/communities routes:",
      e?.message || e
    );
  }

  // adhésions / memberships
  try {
    router.use("/communaute/memberships", require("../communaute/memberships"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/memberships routes:",
      e?.message || e
    );
  }

  // demandes d’adhésion
  try {
    router.use("/communaute/requests", require("../communaute/requests"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/requests routes:",
      e?.message || e
    );
  }

  // avis sur les communautés
  try {
    router.use("/communaute/reviews", require("../communaute/reviews"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/reviews routes:",
      e?.message || e
    );
  }

  // réclamations
  try {
    router.use("/communaute/complaints", require("../communaute/complaints"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/complaints routes:",
      e?.message || e
    );
  }

  // posts (fil d’actualité communautaire)
  try {
    router.use("/communaute/posts", require("../communaute/posts"));
  } catch (e) {
    console.error("Failed to mount /communaute/posts routes:", e?.message || e);
  }

  // formations / courses
  try {
    router.use("/communaute/courses", require("../communaute/courses"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/courses routes:",
      e?.message || e
    );
  }

  // groupes de la communauté
  try {
    router.use("/communaute/groups", require("../communaute/groups"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/groups routes:",
      e?.message || e
    );
  }

  // discussions (privées + groupes)
  try {
    router.use("/communaute/discussions", require("../communaute/discussions"));
  } catch (e) {
    console.error(
      "Failed to mount /communaute/discussions routes:",
      e?.message || e
    );
  }

  try {
    router.use("/communaute/lives", require("../communaute/lives"));
  } catch (e) {
    console.error("Erreur lives:", e);
  }

  // stats globales de la communauté
  try {
    router.use("/communaute", require("../communaute/stats"));
  } catch (e) {
    console.error("Failed to mount /communaute stats routes:", e?.message || e);
  }
};
