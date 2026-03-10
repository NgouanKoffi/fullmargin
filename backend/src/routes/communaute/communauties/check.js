const { Community, nameExistsCI } = require("./_shared");

module.exports = (router) => {
  router.get("/slug/:slug/check", async (req, res) => {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return res.status(400).json({ ok: false, error: "Slug requis" });
    const exists = await Community.exists({ slug, deletedAt: null });
    return res.json({ ok: true, data: { available: !exists } });
  });

  router.get("/name/check", async (req, res) => {
    const raw = req.query.name || "";
    const v = String(raw).trim();
    if (!v) return res.status(400).json({ ok: false, error: "Nom requis" });
    const exists = await nameExistsCI(v);
    return res.json({ ok: true, data: { available: !exists } });
  });
};
