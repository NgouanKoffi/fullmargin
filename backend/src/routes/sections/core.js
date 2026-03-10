// backend/src/routes/sections/core.js
module.exports = function coreSection(router) {
  // /health
  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // /debug (facultatif, comme avant)
  try {
    router.use("/debug", require("../debug.routes.js"));
  } catch (e) {
    console.error("Failed to mount /debug routes:", e?.message || e);
  }
};
