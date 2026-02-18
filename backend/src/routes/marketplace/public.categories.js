// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\public.categories.js
const express = require("express");
const router = express.Router();
const Category = require("../../models/category.model");

router.get("/", async (_req, res) => {
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
    console.error("[PUBLIC CATEGORIES] list ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des catégories impossible" });
  }
});

module.exports = router;
