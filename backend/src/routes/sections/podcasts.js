// backend/src/routes/sections/podcasts.js
module.exports = function podcastsSection(router) {
  try {
    router.use("/podcasts", require("../podcasts"));
  } catch (e) {
    console.error("Failed to mount /podcasts routes:", e?.message || e);
  }

  try {
    router.use("/public/podcasts", require("../public.podcasts"));
  } catch (e) {
    console.error("Failed to mount /public/podcasts routes:", e?.message || e);
  }
};
