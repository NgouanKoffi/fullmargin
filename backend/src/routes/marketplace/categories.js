// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\categories.js
const express = require("express");
const router = express.Router();
const Category = require("../../models/category.model");
const { verifyAuthHeader } = require("../auth/_helpers");

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await Category.find({ deletedAt: null })
      .select("_id key label commissionPct")
      .sort({ label: 1, key: 1 })
      .lean();

    const items = rows.map((c) => ({
      id: String(c._id),
      key: c.key,
      label: c.label,
      commissionPct: Number(c.commissionPct || 0),
    }));

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[CATEGORIES] user list ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des catégories impossible" });
  }
});

module.exports = router;
