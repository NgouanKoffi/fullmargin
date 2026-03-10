// backend/src/routes/marketplace/profile.products.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");
const mongoose = require("mongoose");

const Product = require("../../models/product.model");

let Order = null;
try {
  Order = require("../../models/order.model");
} catch {
  Order = null;
}

let License = null;
try {
  License = require("../../models/license.model");
} catch {
  License = null;
}

const { verifyAuthHeader } = require("../auth/_helpers");

/* ===================== utils ===================== */
const str = (v) => (typeof v === "string" ? v.trim() : "");
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);

const isObjectIdLike = (s) => /^[a-fA-F0-9]{24}$/.test(String(s || "").trim());
const toObjectId = (s) => {
  const v = String(s || "").trim();
  if (!isObjectIdLike(v)) return null;
  try {
    return new mongoose.Types.ObjectId(v);
  } catch {
    return null;
  }
};

/** IMPORTANT:
 * Certains anciens documents peuvent avoir items.product stocké en "String" au lieu de ObjectId.
 * On match donc les 2 formes (ObjectId + String) pour être robuste.
 */
function productMatchValue(productId) {
  const s = String(productId || "").trim();
  const oid = toObjectId(s);
  if (oid) return { $in: [oid, s] };
  return s;
}

router.use((req, _res, next) => {
  req._rid =
    req._rid || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  next();
});

router.use((_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

function requireAuth(req, res, next) {
  try {
    const a = verifyAuthHeader(req);
    if (!a || !a.userId)
      return res.status(401).json({ ok: false, error: "Non autorisé" });
    req.auth = { userId: a.userId, role: a.role || "user" };
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}

/* ===================== download helpers ===================== */
function guessExt(mime = "") {
  const map = {
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
    "application/x-rar-compressed": "rar",
    "application/vnd.rar": "rar",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/octet-stream": "bin",
  };
  return map[mime] || "";
}

function safeFileName(name = "", mime = "") {
  const base = (String(name || "").trim() || "file").replace(/[\/\\]/g, "_");
  if (/\.[a-z0-9]{1,8}$/i.test(base)) return base;
  const ext = guessExt(mime);
  return ext ? `${base}.${ext}` : base;
}

function contentDisposition(name, mime) {
  const fn = safeFileName(name, mime);
  return `attachment; filename="${fn}"; filename*=UTF-8''${encodeURIComponent(
    fn
  )}`;
}

function streamWithRedirects(srcUrl, res, headers, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    let u = new URL(srcUrl);
    const client = u.protocol === "http:" ? http : https;

    const req = client.get(u, (up) => {
      const code = up.statusCode || 0;

      if (
        [301, 302, 303, 307, 308].includes(code) &&
        up.headers.location &&
        maxRedirects > 0
      ) {
        up.resume();
        const next = new URL(up.headers.location, u).toString();
        return streamWithRedirects(next, res, headers, maxRedirects - 1).then(
          resolve,
          reject
        );
      }

      if (code >= 400) return reject(new Error(`Upstream returned ${code}`));

      if (up.headers["content-length"])
        res.set("Content-Length", up.headers["content-length"]);

      const mime =
        headers.contentType ||
        up.headers["content-type"] ||
        "application/octet-stream";
      res.set("Content-Type", mime);

      if (headers.disposition)
        res.set("Content-Disposition", headers.disposition);

      up.pipe(res);
      up.on("end", resolve);
      up.on("error", reject);
    });

    req.on("error", reject);
  });
}

/**
 * Droits:
 * - owner du produit
 * - ou acheteur (order succeeded/processing contient ce product)
 */
async function userCanAccessProduct(userId, productId, productOwnerId) {
  if (!userId || !productId) return false;

  // owner
  if (productOwnerId && String(productOwnerId) === String(userId)) return true;

  // buyer via orders
  if (!Order) return false;

  const exists = await Order.exists({
    user: userId,
    status: { $in: ["succeeded", "processing"] },
    // ✅ robust match (ObjectId OR String)
    "items.product": productMatchValue(productId),
    deletedAt: null,
  });

  return !!exists;
}

function parseIdsParam(raw) {
  const s = str(raw);
  const ids = s
    .split(/[,\s]+/)
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  // dédupe en gardant l’ordre
  const out = [];
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Construit un Set des productIds achetés par l’utilisateur (robuste String/ObjectId) */
async function loadPurchasedProductIdSet(userId) {
  const set = new Set();
  if (!Order) return set;

  const rows = await Order.find({
    user: userId,
    status: { $in: ["succeeded", "processing"] },
    deletedAt: null,
  })
    .select("items.product")
    .lean();

  for (const o of rows || []) {
    for (const it of o.items || []) {
      const v = it && it.product != null ? String(it.product).trim() : "";
      if (v) set.add(v);
    }
  }
  return set;
}

/** Map des licences par productId (dernière licence connue) */
async function loadLicenseMap(userId, objIds) {
  const map = new Map(); // key: productId string -> license row
  if (!License) return map;
  if (!userId || !Array.isArray(objIds) || objIds.length === 0) return map;

  // On récupère toutes les licences user+products, et on garde la plus récente
  const rows = await License.find({
    user: userId,
    product: { $in: objIds },
    status: { $in: ["issued", "renewed"] },
  })
    .select("product expiresAt status updatedAt createdAt")
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  for (const r of rows || []) {
    const pid = String(r.product || "").trim();
    if (!pid) continue;
    // comme on est trié desc, la première rencontrée est la plus récente
    if (!map.has(pid)) map.set(pid, r);
  }

  return map;
}

/* =========================================================
   GET /api/marketplace/profile/products/batch?ids=a,b,c
========================================================= */
router.get("/batch", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const ids = parseIdsParam(req.query.ids);

    if (!ids.length)
      return res.status(200).json({ ok: true, data: { items: [] } });

    // ✅ on ne query que les ids valides
    const objIds = ids.map(toObjectId).filter(Boolean);

    if (!objIds.length)
      return res.status(200).json({ ok: true, data: { items: [] } });

    // ✅ 1) achats (1 seule fois)
    const purchasedSet = await loadPurchasedProductIdSet(req.auth.userId);

    // ✅ 2) licences (1 seule fois)
    const licMap = await loadLicenseMap(req.auth.userId, objIds);

    // ✅ 3) produits demandés
    const rows = await Product.find({ _id: { $in: objIds }, deletedAt: null })
      .select(
        "_id user title imageUrl shortDescription fileUrl fileName fileMime type"
      )
      .lean();

    // ✅ 4) filtrage autorisé (owner OU acheté)
    const allowed = [];
    for (const p of rows || []) {
      const pid = String(p._id || "").trim();
      const ownerOk = String(p.user) === String(req.auth.userId);
      const boughtOk = purchasedSet.has(pid);

      let ok = ownerOk || boughtOk;
      if (!ok) {
        ok = await userCanAccessProduct(req.auth.userId, p._id, p.user);
      }

      if (!ok) continue;

      const lic = licMap.get(pid) || null;

      allowed.push({
        id: String(p._id),
        title: p.title || "",
        imageUrl: p.imageUrl || "",
        shortDescription: p.shortDescription || "",
        fileUrl: p.fileUrl || "",
        fileName: p.fileName || "",
        fileMime: p.fileMime || "",
        type: p.type || "",
        // ✅ licence seulement si elle existe (sinon null)
        license: lic
          ? {
              status: lic.status || "issued",
              expiresAt: lic.expiresAt
                ? new Date(lic.expiresAt).toISOString()
                : null,
            }
          : null,
      });
    }

    return res.status(200).json({ ok: true, data: { items: allowed } });
  } catch (e) {
    console.error(`[PROFILE PRODUCTS ${rid}] GET /batch ERROR:`, e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement produits impossible" });
  }
});

/* =========================================================
   GET /api/marketplace/profile/products/:id/download
========================================================= */
router.get("/:id/download", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const id = str(req.params.id);

    if (!isObjectIdLike(id)) {
      return res.status(400).json({ ok: false, error: "Id invalide" });
    }

    const p = await Product.findOne({ _id: id, deletedAt: null })
      .select("_id user fileUrl fileName fileMime")
      .lean();

    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    const ok = await userCanAccessProduct(req.auth.userId, p._id, p.user);
    if (!ok) return res.status(403).json({ ok: false, error: "Accès refusé" });

    if (!p.fileUrl)
      return res.status(404).json({ ok: false, error: "Fichier absent" });

    const mime = clampStr(p.fileMime || "application/octet-stream", 120);
    const disp = contentDisposition(p.fileName || "fichier", mime);

    res.set("Cache-Control", "no-store");
    await streamWithRedirects(p.fileUrl, res, {
      contentType: mime,
      disposition: disp,
    });
  } catch (e) {
    console.error(
      `[PROFILE PRODUCTS ${rid}] GET /:id/download ERROR:`,
      e?.stack || e
    );
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ ok: false, error: "Téléchargement impossible" });
    }
  }
});

module.exports = router;
