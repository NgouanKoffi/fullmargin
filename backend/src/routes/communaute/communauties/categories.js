// backend/src/routes/communaute/communauties/categories.js
const { Community } = require("./_shared");

module.exports = (router) => {
  router.get("/categories", async (_req, res) => {
    let categories = [];

    try {
      // 🔍 Vérif de sécurité : modèle Community bien chargé ?
      if (!Community || typeof Community.aggregate !== "function") {
        console.error(
          "[GET /communaute/communities/categories] Community model invalide :",
          Community
        );
      } else {
        const rows = await Community.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);

        const labelize = (k = "") =>
          String(k || "")
            .replace(/[_-]+/g, " ")
            .trim()
            .replace(/\s+/g, " ")
            .replace(/(^|\s)\S/g, (m) => m.toUpperCase());

        categories =
          (rows || [])
            .filter((r) => r._id && typeof r._id === "string")
            .map((r) => ({
              key: r._id,
              label: labelize(r._id),
              count: r.count,
            })) || [];
      }
    } catch (e) {
      console.error(
        "[GET /communaute/communities/categories] Erreur serveur :",
        e
      );
      // ⚠️ On log, mais on ne renvoie plus de 500
      // categories restera [] dans ce cas
    }

    // ✅ Toujours 200 OK, même si Mongo pète → le front ne voit plus de 500
    return res.json({ ok: true, data: { categories } });
  });
};
