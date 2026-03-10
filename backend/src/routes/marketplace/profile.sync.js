// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\profile.sync.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const UserCart = require("../../models/userCart.model");
const UserWishlist = require("../../models/userWishlist.model");
const { verifyAuthHeader } = require("../auth/_helpers");

/* ---------- Auth middleware ---------- */
function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    req.auth = { userId: a.userId, role: a.role || "user" };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
}
router.use(requireAuth);

/* ---------- Utils ---------- */
const noStore = (res) => res.set("Cache-Control", "no-store");
const castUid = (id) =>
  mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

/* =========================================================
   WISHLIST
   ========================================================= */

// GET /wishlist
router.get("/wishlist", async (req, res) => {
  try {
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });
    const doc = await UserWishlist.findOne({ user: uid }).lean();
    noStore(res);
    return res.json({
      ok: true,
      data: { ids: doc?.ids || [], updatedAt: doc?.updatedAt || null },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// PUT /wishlist  (REPLACE STRICT)
router.put("/wishlist", async (req, res) => {
  try {
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ ok: false, error: "unsupported_media_type" });
    }
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const cleaned = [...new Set(ids.filter((x) => typeof x === "string"))];

    const doc = await UserWishlist.findOneAndUpdate(
      { user: uid },
      { $set: { user: uid, ids: cleaned } },
      { new: true, upsert: true }
    ).lean();

    noStore(res);
    return res.json({
      ok: true,
      data: { ids: doc.ids, updatedAt: doc.updatedAt },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /wishlist/:id  (ajoute 1 id, idempotent) — ignore si déjà au panier
router.post("/wishlist/:id", async (req, res) => {
  try {
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });
    const id = String(req.params.id || "");

    // si déjà au panier → on n'ajoute pas aux favoris
    const cart = await UserCart.findOne({ user: uid }, { items: 1 }).lean();
    const inCart = cart?.items?.some?.((l) => l.id === id && l.qty > 0);

    if (!inCart) {
      await UserWishlist.updateOne(
        { user: uid },
        { $addToSet: { ids: id }, $setOnInsert: { user: uid } },
        { upsert: true }
      );
    }

    const doc = await UserWishlist.findOne({ user: uid }).lean();
    noStore(res);
    return res.json({
      ok: true,
      data: { ids: doc?.ids || [], updatedAt: doc?.updatedAt || null },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// DELETE /wishlist/:id  (retire 1 id)
router.delete("/wishlist/:id", async (req, res) => {
  try {
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });
    const id = String(req.params.id || "");

    await UserWishlist.updateOne({ user: uid }, { $pull: { ids: id } });
    const doc = await UserWishlist.findOne({ user: uid }).lean();
    noStore(res);
    return res.json({
      ok: true,
      data: { ids: doc?.ids || [], updatedAt: doc?.updatedAt || null },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/* =========================================================
   CART
   ========================================================= */

// GET /cart
router.get("/cart", async (req, res) => {
  try {
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });

    const doc = await UserCart.findOne({ user: uid }).lean();
    noStore(res);
    return res.json({
      ok: true,
      data: { items: doc?.items || [], updatedAt: doc?.updatedAt || null },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// PUT /cart  (REPLACE STRICT)
router.put("/cart", async (req, res) => {
  try {
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ ok: false, error: "unsupported_media_type" });
    }
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const cleaned = items
      .filter((x) => x && typeof x.id === "string" && Number.isFinite(x.qty))
      .map((x) => ({ id: String(x.id), qty: Math.max(0, Number(x.qty) || 0) }))
      .filter((x) => x.qty > 0);

    const doc = await UserCart.findOneAndUpdate(
      { user: uid },
      { $set: { user: uid, items: cleaned } },
      { new: true, upsert: true }
    ).lean();

    // 🔴 Invariance: tout id présent au panier est retiré des favoris
    const idsInCart = cleaned.map((x) => x.id);
    if (idsInCart.length > 0) {
      await UserWishlist.updateOne(
        { user: uid },
        { $pull: { ids: { $in: idsInCart } } }
      );
    }

    noStore(res);
    return res.json({
      ok: true,
      data: { items: doc.items, updatedAt: doc.updatedAt },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// PUT /cart/:id  (upsert ligne ; qty=0 => supprime) + invariance wishlist
router.put("/cart/:id", async (req, res) => {
  try {
    const uid = castUid(req.auth.userId);
    if (!uid) return res.status(400).json({ ok: false, error: "bad_user_id" });

    const id = String(req.params.id || "");
    const qty = Math.max(0, Number(req.body?.qty) || 0);

    // Ensure doc
    const doc = await UserCart.findOneAndUpdate(
      { user: uid },
      { $setOnInsert: { user: uid, items: [] } },
      { new: true, upsert: true }
    );

    const items = [...doc.items];
    const i = items.findIndex((x) => x.id === id);
    if (qty <= 0) {
      if (i >= 0) items.splice(i, 1);
    } else if (i >= 0) {
      items[i] = { id, qty };
    } else {
      items.unshift({ id, qty });
    }

    const updated = await UserCart.findOneAndUpdate(
      { user: uid },
      { $set: { items } },
      { new: true }
    ).lean();

    // 🔴 Invariance: si présent au panier, on le retire des favoris
    if (qty > 0) {
      await UserWishlist.updateOne({ user: uid }, { $pull: { ids: id } });
    }

    noStore(res);
    return res.json({
      ok: true,
      data: { items: updated.items, updatedAt: updated.updatedAt },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
