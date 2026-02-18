// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\routes\marketplace\product.js
const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");
const { Types } = require("mongoose"); // ✅ FIX: Types utilisé plus bas

// sharp (optionnel, mais recommandé pour variantes)
let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

const Product = require("../../models/product.model");
const Shop = require("../../models/shop.model");
const User = require("../../models/user.model");
const { verifyAuthHeader } = require("../auth/_helpers");
const { uploadBuffer, uploadImageBuffer } = require("../../utils/storage");
const { createNotif } = require("../../utils/notifications");

/* Optional orders model (if present we check purchase) */
let Order = null;
try {
  Order = require("../../models/order.model");
} catch {
  Order = null;
}

const MAX_SHOW = 800;
const safe = (v) => {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
};
const short = (v, n = MAX_SHOW) => (safe(v) || "").slice(0, n);
const clampStr = (v, max) =>
  String(v || "")
    .trim()
    .slice(0, max);
const toISO = (d) => {
  try {
    const x = d instanceof Date ? d : new Date(d);
    return x.toISOString();
  } catch {
    return "";
  }
};

function randId() {
  return Math.random().toString(36).slice(2, 8);
}

router.use((req, _res, next) => {
  req._rid =
    req._rid || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  req._t0 = Date.now();
  next();
});
router.use((_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
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
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Non autorisé" });
  }
}
function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin")
    return res.status(403).json({ ok: false, error: "Réservé aux admins" });
  next();
}
function tryAuth(req) {
  try {
    const a = verifyAuthHeader(req);
    return a?.userId || null;
  } catch {
    return null;
  }
}

const NEEDS_VERIF = {
  robot_trading: true,
  indicator: true,
  mt4_mt5: false,
  ebook_pdf: false,
  template_excel: false,
};
const BADGE_OK = {
  robot_trading: true,
  indicator: true,
  mt4_mt5: false,
  ebook_pdf: true,
  template_excel: true,
};

function parseDataUrl(dataUrl = "") {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(String(dataUrl).trim());
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}
function resourceTypeFromMime(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/") || mime.startsWith("video/")) return "video";
  return "raw";
}

/** Vérifie si une string est une URL http(s) */
function isHttpUrl(u = "") {
  return /^https?:\/\//i.test(String(u).trim());
}

/* ----------------- download helpers ----------------- */
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

function getExtFromName(name = "", mime = "") {
  const base = String(name || "").trim();
  const m = /\.[a-z0-9]{1,8}$/i.exec(base);
  if (m) return m[0].slice(1).toLowerCase();
  const fromMime = guessExt(mime);
  return fromMime || "bin";
}

function safeFileName(name = "", mime = "") {
  const base = (String(name || "").trim() || "file").replace(/[\/\\]/g, "_");
  if (/\.[a-z0-9]{1,6}$/i.test(base)) return base;
  const ext = guessExt(mime);
  return ext ? `${base}.${ext}` : base;
}
function contentDisposition(name, mime) {
  const fn = safeFileName(name, mime);
  return `attachment; filename="${fn}"; filename*=UTF-8''${encodeURIComponent(
    fn,
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
          reject,
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
      else if (up.headers["content-disposition"])
        res.set("Content-Disposition", up.headers["content-disposition"]);

      up.pipe(res);
      up.on("end", resolve);
      up.on("error", reject);
    });

    req.on("error", reject);
  });
}

async function userCanDownload(userId, productDoc) {
  if (!userId || !productDoc) return false;
  if (String(productDoc.user) === String(userId)) return true;

  if (!Order) return false;

  const uid = String(userId || "").trim();
  const pid = String(productDoc._id || "").trim();

  const userOr = [{ user: uid }];
  if (Types.ObjectId.isValid(uid))
    userOr.push({ user: new Types.ObjectId(uid) });

  const prodOr = [{ "items.product": pid }];
  if (Types.ObjectId.isValid(pid))
    prodOr.push({ "items.product": new Types.ObjectId(pid) });

  const found = await Order.collection.findOne(
    {
      $and: [
        { $or: userOr },
        { status: { $in: ["succeeded", "processing"] } },
        { $or: prodOr },
      ],
    },
    { projection: { _id: 1 } },
  );

  return !!found;
}

const MAX_DATAURL_BYTES = 8 * 1024 * 1024; // 8MB

/* ============================
 *  COVER VARIANTS (LCP FIX)
 * ============================ */
const COVER_VARIANTS = [
  { w: 320, q: 72, key: "320" },
  { w: 640, q: 75, key: "640" },
  { w: 960, q: 78, key: "960" },
  { w: 1280, q: 80, key: "1280" },
];

async function uploadCoverWithVariants(buffer, { userId }) {
  // fallback si sharp non dispo => upload original
  if (!sharp) {
    const publicId = `products/${userId}/cover_${Date.now()}_${randId()}_orig`;
    const up = await uploadImageBuffer(buffer, {
      folder: "marketplace/products/images",
      publicId,
    });
    const url = up?.secure_url || "";
    return {
      imageUrl: url,
      image: url
        ? { src: url, srcset: {}, w: null, h: null, format: "" }
        : null,
    };
  }

  const meta = await sharp(buffer)
    .rotate()
    .metadata()
    .catch(() => ({}));
  const srcset = {};
  let src = "";

  const baseId = `products/${userId}/cover_${Date.now()}_${randId()}`;

  for (const v of COVER_VARIANTS) {
    const out = await sharp(buffer)
      .rotate()
      .resize({ width: v.w, withoutEnlargement: true })
      .webp({ quality: v.q })
      .toBuffer();

    const up = await uploadImageBuffer(out, {
      folder: "marketplace/products/images",
      publicId: `${baseId}_${v.key}`,
    });

    const url = up?.secure_url || up?.url || "";
    if (url) {
      srcset[v.key] = url;
      if (v.w === 640) src = url; // default “listing”
    }
  }

  if (!src) src = srcset["320"] || srcset["960"] || srcset["1280"] || "";

  const image = src
    ? {
        src,
        srcset,
        w: meta?.width ?? null,
        h: meta?.height ?? null,
        format: "webp",
      }
    : null;

  return { imageUrl: src || "", image };
}

async function normalizeProductThumbAndMaybeMigrate(
  productId,
  imageUrl,
  userId,
  existingImage,
) {
  // si on a déjà un champ image.src, on s’en sert direct
  if (existingImage && typeof existingImage === "object") {
    const s = String(existingImage.src || "").trim();
    if (s) return { imageUrl: s, image: existingImage };
  }

  let url = String(imageUrl || "").trim();
  if (!url) return { imageUrl: "", image: null };

  // URL normale
  if (isHttpUrl(url) || url.startsWith("/")) {
    return { imageUrl: url, image: existingImage || null };
  }

  // data:image/... => upload + update DB (migrate legacy)
  if (/^data:/i.test(url)) {
    const parsed = parseDataUrl(url);
    if (parsed && parsed.mime?.startsWith("image/")) {
      if (parsed.buffer.length <= MAX_DATAURL_BYTES) {
        try {
          const out = await uploadCoverWithVariants(parsed.buffer, { userId });

          if (out?.imageUrl) {
            // ⚠️ image ne sera persisté que si tu ajoutes le champ dans le schema Product
            await Product.updateOne(
              { _id: productId },
              {
                $set: {
                  imageUrl: out.imageUrl,
                  image: out.image || undefined,
                },
                $currentDate: { updatedAt: true },
              },
            );

            return { imageUrl: out.imageUrl, image: out.image || null };
          }
        } catch {
          return { imageUrl: "", image: null };
        }
      }
    }
    return { imageUrl: "", image: null };
  }

  return { imageUrl: "", image: null };
}

/* ============ LISTE (mes produits) ============ */
router.get("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const rows = await Product.find({ user: req.auth.userId, deletedAt: null })
      .sort({ updatedAt: -1, _id: -1 })
      .select(
        "_id title shortDescription type imageUrl image fileName pricing status moderation badgeEligible createdAt updatedAt ratingAvg ratingCount shop gallery",
      )
      .lean();

    const items = [];
    for (const p of rows) {
      // ✅ migration legacy dataURL + préférence image.src
      const norm = await normalizeProductThumbAndMaybeMigrate(
        p._id,
        p.imageUrl,
        req.auth.userId,
        p.image,
      );

      const gallery = Array.isArray(p.gallery)
        ? p.gallery.map((u) => String(u || "").trim()).filter(Boolean)
        : [];

      const images = [];
      if (norm.imageUrl) images.push(norm.imageUrl);
      for (const u of gallery) {
        if (!u) continue;
        if (u === norm.imageUrl) continue;
        if (isHttpUrl(u) || u.startsWith("/")) images.push(u);
      }

      items.push({
        id: String(p._id),
        title: p.title,
        shortDescription: p.shortDescription,
        type: p.type,

        // ✅ cover optimisée
        imageUrl: norm.imageUrl || "",
        image: norm.image || null, // ✅ srcset ici si schema le permet

        images, // ✅ si ton front préfère images[0]

        fileName: p.fileName || "",
        pricing: p.pricing,
        status: p.status,
        moderationReason: (p.moderation && p.moderation.reason) || "",
        moderationReviewedAt: p.moderation?.reviewedAt
          ? toISO(p.moderation.reviewedAt)
          : null,
        badgeEligible: !!p.badgeEligible,
        createdAt: toISO(p.createdAt),
        updatedAt: toISO(p.updatedAt),
        ratingAvg: Number(p.ratingAvg || 0),
        ratingCount: Number(p.ratingCount || 0),
        shop: p.shop ? String(p.shop) : null,
      });
    }

    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    console.error(`[PROD ${rid}] GET ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ============ GET BY ID (édition) ============ */
router.get("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const p = await Product.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    }).lean();
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    return res.status(200).json({
      ok: true,
      data: {
        product: {
          ...p,
          moderation: p.moderation || { required: false, reason: "" },
        },
      },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] GET /products/:id ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Chargement impossible" });
  }
});

/* ============ CRÉER (soumettre) ============ */
router.post("/", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const b = req.body || {};
    const shop = await Shop.findOne({ user: req.auth.userId, deletedAt: null });
    if (!shop)
      return res
        .status(409)
        .json({ ok: false, error: "Crée une boutique d’abord." });

    const title = clampStr(b.title, 120);

    // ✅ on garde le JSON BlockNote tel quel
    const shortDescription =
      typeof b.shortDescription === "string" ? b.shortDescription : "";
    const longDescription =
      typeof b.longDescription === "string" ? b.longDescription : "";

    const category = clampStr(b.category, 80);
    const type = String(b.type || "");

    if (!title || !shortDescription || !longDescription || !type) {
      return res
        .status(400)
        .json({ ok: false, error: "Champs requis manquants." });
    }

    const needs = !!NEEDS_VERIF[type];
    const badgeEligible = false;

    /* ----- IMAGE COVER (avec variantes) ----- */
    let imageUrl = "";
    let image = null;

    const rawImage = (b.imageUrl || b.imageDataUrl || "").trim();
    if (rawImage) {
      if (isHttpUrl(rawImage) || rawImage.startsWith("/")) {
        imageUrl = clampStr(rawImage, 500000);
        image = null; // pas de srcset si URL externe
      } else if (/^data:/i.test(rawImage)) {
        const parsedImg = parseDataUrl(rawImage);
        if (parsedImg && parsedImg.mime?.startsWith("image/")) {
          if (parsedImg.buffer.length > MAX_DATAURL_BYTES) {
            return res.status(400).json({
              ok: false,
              error: "Image trop lourde (max 8MB).",
            });
          }
          const out = await uploadCoverWithVariants(parsedImg.buffer, {
            userId: req.auth.userId,
          });
          imageUrl = out.imageUrl || "";
          image = out.image || null;
        }
      }
      // on ignore blob: et autres schémas
    }

    /* ----- GALERIE D'IMAGES ----- */
    let gallery = [];
    if (Array.isArray(b.gallery)) {
      for (const raw of b.gallery) {
        const v = String(raw || "").trim();
        if (!v) continue;

        if (isHttpUrl(v) || v.startsWith("/")) {
          gallery.push(clampStr(v, 500000));
        } else if (/^data:/i.test(v)) {
          const parsed = parseDataUrl(v);
          if (parsed && parsed.mime?.startsWith("image/")) {
            const publicId = `products/${
              req.auth.userId
            }/gallery_${Date.now()}_${randId()}`;
            const up = await uploadImageBuffer(parsed.buffer, {
              folder: "marketplace/products/gallery",
              publicId,
            });
            if (up?.secure_url) gallery.push(up.secure_url);
          }
        }
      }
    }

    /* ----- FICHIER PRODUIT ----- */
    let fileUrl = clampStr(b.fileUrl || "", 500000);
    let fileName = clampStr(b.fileName || "", 250);
    let fileMime = clampStr(b.fileMime || "", 120);

    if (!fileUrl && b.fileDataUrl) {
      const parsed = parseDataUrl(b.fileDataUrl);
      if (parsed) {
        const publicId = `products/${
          req.auth.userId
        }/${Date.now()}_${randId()}`;
        const resourceType = resourceTypeFromMime(parsed.mime);
        const ext =
          resourceType === "raw" ? getExtFromName(fileName, parsed.mime) : "";

        const up = await uploadBuffer(parsed.buffer, {
          folder: "marketplace/products",
          publicId,
          resourceType,
          extension: ext || undefined,
          uploadOptions: resourceType === "raw" ? { resource_type: "raw" } : {},
        });

        fileUrl = up.secure_url;
        if (!fileName) {
          const guessedName = safeFileName(
            `product_${Date.now()}.${ext || "bin"}`,
            parsed.mime,
          );
          fileName = guessedName;
        }
        if (!fileMime) fileMime = parsed.mime || "";
      }
    }

    /* ----- LIENS VIDÉO ----- */
    let videoUrls = [];
    if (Array.isArray(b.videoUrls)) {
      videoUrls = b.videoUrls
        .map((u) => String(u || "").trim())
        .filter((u) => u && isHttpUrl(u))
        .map((u) => clampStr(u, 1000));
    } else if (typeof b.videoUrl === "string") {
      const u = b.videoUrl.trim();
      if (u && isHttpUrl(u)) videoUrls = [clampStr(u, 1000)];
    }

    const pricing =
      b.pricing && typeof b.pricing === "object" ? b.pricing : null;
    if (
      !pricing ||
      !["one_time", "subscription"].includes(pricing.mode) ||
      pricing.amount == null
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "Tarification invalide." });
    }
    if (
      pricing.mode === "subscription" &&
      !["month", "year"].includes(pricing.interval)
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "Intervalle d’abonnement invalide." });
    }

    const product = await Product.create({
      user: req.auth.userId,
      shop: shop._id,
      title,
      shortDescription,
      longDescription,
      category,
      type,

      imageUrl,
      image, // ✅ variantes (si schema le permet)

      fileUrl,
      fileName,
      fileMime,
      pricing,
      termsAccepted: !!b.termsAccepted,
      status: needs ? "pending" : "published",
      moderation: { required: needs },
      badgeEligible,
      gallery,
      videoUrls,
    });

    // 🔔 Notification: produit soumis
    await createNotif({
      userId: req.auth.userId,
      kind: "marketplace_product_submitted",
      payload: {
        productId: String(product._id),
        productName: title,
        status: product.status,
        message: needs
          ? "Votre produit est en attente de validation."
          : "Votre produit a été publié avec succès.",
      },
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: String(product._id),
        status: product.status,
        updatedAt: toISO(product.updatedAt),
      },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] POST ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Création impossible" });
  }
});

/* ============ PATCH (éditeur) ============ */
router.patch("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const p = await Product.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    const b = req.body || {};
    if (b.title !== undefined) p.title = clampStr(b.title, 120) || p.title;

    if (typeof b.shortDescription === "string") {
      p.shortDescription = b.shortDescription;
    }
    if (typeof b.longDescription === "string") {
      p.longDescription = b.longDescription;
    }

    if (b.category !== undefined)
      p.category = clampStr(b.category, 80) || p.category;

    if (b.type !== undefined) {
      const newType = String(b.type || "");
      if (
        newType &&
        [
          "robot_trading",
          "indicator",
          "mt4_mt5",
          "ebook_pdf",
          "template_excel",
        ].includes(newType)
      ) {
        p.type = newType;
        const needs = !!NEEDS_VERIF[newType];
        if (!BADGE_OK[newType]) p.badgeEligible = false;
        if (needs) {
          if (p.status === "rejected" || p.status === "published")
            p.status = "pending";
          p.moderation = { ...(p.moderation || {}), required: true };
        } else {
          if (p.status === "pending" || p.status === "rejected")
            p.status = "published";
          p.moderation = { ...(p.moderation || {}), required: false };
        }
      }
    }

    /* ----- IMAGE COVER (édition) ----- */
    if (b.imageUrl !== undefined || b.imageDataUrl !== undefined) {
      const rawImage = (b.imageUrl || b.imageDataUrl || "").trim();
      if (rawImage) {
        if (isHttpUrl(rawImage) || rawImage.startsWith("/")) {
          p.imageUrl = clampStr(rawImage, 500000);
          // si URL externe, on ne peut pas garantir srcset => on vide p.image
          p.image = undefined;
        } else if (/^data:/i.test(rawImage)) {
          const parsedImg = parseDataUrl(rawImage);
          if (parsedImg && parsedImg.mime?.startsWith("image/")) {
            if (parsedImg.buffer.length > MAX_DATAURL_BYTES) {
              return res.status(400).json({
                ok: false,
                error: "Image trop lourde (max 8MB).",
              });
            }
            const out = await uploadCoverWithVariants(parsedImg.buffer, {
              userId: req.auth.userId,
            });
            if (out?.imageUrl) {
              p.imageUrl = out.imageUrl;
              p.image = out.image || undefined;
            }
          }
        }
      }
    }

    /* ----- FICHIER PRODUIT (édition) ----- */
    if (b.fileDataUrl) {
      const parsed = parseDataUrl(b.fileDataUrl);
      if (parsed) {
        const publicId = `products/${
          req.auth.userId
        }/${Date.now()}_${randId()}`;
        const resourceType = resourceTypeFromMime(parsed.mime);
        const ext =
          resourceType === "raw"
            ? getExtFromName(b.fileName || p.fileName, parsed.mime)
            : "";

        const up = await uploadBuffer(parsed.buffer, {
          folder: "marketplace/products",
          publicId,
          resourceType,
          extension: ext || undefined,
          uploadOptions: resourceType === "raw" ? { resource_type: "raw" } : {},
        });
        p.fileUrl = up.secure_url;
        p.fileMime = parsed.mime || p.fileMime;
        if (!p.fileName) {
          const guessedName = safeFileName(
            `product_${Date.now()}.${ext || "bin"}`,
            parsed.mime,
          );
          p.fileName = guessedName;
        }
      }
    }

    if (b.fileUrl !== undefined) p.fileUrl = clampStr(b.fileUrl, 500000);
    if (b.fileName !== undefined) p.fileName = clampStr(b.fileName, 250);
    if (b.fileMime !== undefined) p.fileMime = clampStr(b.fileMime, 120);

    /* ----- GALERIE (édition) ----- */
    if (b.gallery !== undefined) {
      const src = Array.isArray(b.gallery) ? b.gallery : [];
      const next = [];

      for (const raw of src) {
        const v = String(raw || "").trim();
        if (!v) continue;

        if (isHttpUrl(v) || v.startsWith("/")) {
          next.push(clampStr(v, 500000));
        } else if (/^data:/i.test(v)) {
          const parsed = parseDataUrl(v);
          if (parsed && parsed.mime?.startsWith("image/")) {
            const publicId = `products/${
              req.auth.userId
            }/gallery_${Date.now()}_${randId()}`;
            const up = await uploadImageBuffer(parsed.buffer, {
              folder: "marketplace/products/gallery",
              publicId,
            });
            if (up?.secure_url) next.push(up.secure_url);
          }
        }
      }

      p.gallery = next;
    }

    /* ----- LIENS VIDÉO (édition) ----- */
    if (b.videoUrls !== undefined || b.videoUrl !== undefined) {
      let vids = [];
      if (Array.isArray(b.videoUrls)) vids.push(...b.videoUrls);
      if (typeof b.videoUrl === "string") vids.push(b.videoUrl);

      p.videoUrls = vids
        .map((u) => String(u || "").trim())
        .filter((u) => u && isHttpUrl(u))
        .map((u) => clampStr(u, 1000));
    }

    if (b.pricing !== undefined) {
      const pr = b.pricing && typeof b.pricing === "object" ? b.pricing : null;
      if (
        !pr ||
        !["one_time", "subscription"].includes(pr.mode) ||
        pr.amount == null
      )
        return res
          .status(400)
          .json({ ok: false, error: "Tarification invalide." });
      if (
        pr.mode === "subscription" &&
        !["month", "year"].includes(pr.interval)
      )
        return res
          .status(400)
          .json({ ok: false, error: "Intervalle d’abonnement invalide." });
      p.pricing = pr;
    }

    if (b.termsAccepted !== undefined) p.termsAccepted = !!b.termsAccepted;

    if (p.moderation?.required && p.status === "rejected") p.status = "pending";

    await p.save();
    return res.status(200).json({
      ok: true,
      data: { updatedAt: toISO(p.updatedAt), status: p.status },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] PATCH ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Sauvegarde impossible" });
  }
});

/* ============ DELETE (soft) ============ */
router.delete("/:id", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const p = await Product.findOne({
      _id: req.params.id,
      user: req.auth.userId,
      deletedAt: null,
    });
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });
    p.deletedAt = new Date();
    await p.save();
    return res.status(200).json({ ok: true, data: { deleted: true } });
  } catch (e) {
    console.error(`[PROD ${rid}] DELETE ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Suppression impossible" });
  }
});

/* ============ ADMIN: review (existant) ============ */
router.post("/:id/review", requireAuth, requireAdmin, async (req, res) => {
  const rid = req._rid;
  try {
    const { action, reason } = req.body || {};
    const p = await Product.findOne({ _id: req.params.id, deletedAt: null });
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    if (!p.moderation?.required)
      return res.status(400).json({
        ok: false,
        error: "Ce produit ne requiert pas d’approbation.",
      });

    if (action === "approve") {
      p.status = "published";
      p.moderation.reason = "";

      // 🔔 Notification: produit approuvé
      await createNotif({
        userId: String(p.user),
        kind: "marketplace_product_approved",
        payload: {
          productId: String(p._id),
          productName: p.title,
          message: `Votre produit "${p.title}" a été approuvé et est maintenant publié !`,
        },
      });
    } else if (action === "reject") {
      p.status = "rejected";
      p.moderation.reason = clampStr(reason, 300);

      // 🔔 Notification: produit refusé
      await createNotif({
        userId: String(p.user),
        kind: "marketplace_product_rejected",
        payload: {
          productId: String(p._id),
          productName: p.title,
          reason: p.moderation.reason,
          message: `Votre produit "${p.title}" a été refusé. Raison: ${p.moderation.reason}`,
        },
      });
    } else if (action === "suspend") {
      p.status = "suspended";
      p.moderation.reason = clampStr(reason, 300);
    } else return res.status(400).json({ ok: false, error: "Action invalide" });

    p.moderation.reviewedAt = new Date();
    p.moderation.reviewedBy = req.auth.userId;
    await p.save();
    return res.status(200).json({
      ok: true,
      data: {
        status: p.status,
        reviewedAt: toISO(p.moderation.reviewedAt),
        reason: p.moderation.reason,
      },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] REVIEW ERROR: ${e?.stack || e}`);
    return res.status(500).json({ ok: false, error: "Action impossible" });
  }
});

/* ============ AVIS: GET (existant) ============ */
router.get("/:id/reviews", async (req, res) => {
  const rid = req._rid;
  try {
    const me = tryAuth(req);
    const p = await Product.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).lean();
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    const reviews = (p.reviews || [])
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const myReview = me
      ? reviews.find((r) => String(r.user) === String(me))
      : null;

    const userIds = Array.from(
      new Set(reviews.map((r) => String(r.user)).filter(Boolean)),
    );
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select("_id fullName")
          .lean()
      : [];
    const nameMap = new Map(
      users.map((u) => [String(u._id), u.fullName || ""]),
    );

    return res.status(200).json({
      ok: true,
      data: {
        average: p.ratingAvg || 0,
        count: p.ratingCount || reviews.length,
        isOwner: me ? String(p.user) === String(me) : false,
        reviews: reviews.map((r) => ({
          id: String(r.user),
          user: String(r.user),
          userName: nameMap.get(String(r.user)) || "Utilisateur",
          rating: r.rating,
          comment: r.comment,
          createdAt: toISO(r.createdAt),
        })),
        myReview: myReview
          ? {
              id: String(myReview.user),
              user: String(myReview.user),
              userName: nameMap.get(String(myReview.user)) || "",
              rating: myReview.rating,
              comment: myReview.comment,
              createdAt: toISO(myReview.createdAt),
            }
          : null,
      },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] GET /reviews ERROR: ${e?.stack || e}`);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des avis impossible" });
  }
});

/* ============ AVIS: POST (ajout/mise à jour) ============ */
router.post("/:id/reviews", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const userId = String(req.auth.userId || "");
    const { rating, comment } = req.body || {};

    const r = Math.round(Number(rating));
    if (!Number.isFinite(r) || r < 1 || r > 5)
      return res
        .status(400)
        .json({ ok: false, error: "Note invalide (1 à 5)." });
    const txt = clampStr(comment, 2000);

    const p = await Product.findOne({
      _id: String(req.params.id || ""),
      deletedAt: null,
    });
    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    if (String(p.user) === userId)
      return res.status(400).json({
        ok: false,
        error: "Vous ne pouvez pas laisser un avis sur votre propre produit.",
      });

    const now = new Date();
    const idx = (p.reviews || []).findIndex((rv) => String(rv.user) === userId);
    if (idx >= 0) {
      p.reviews[idx].rating = r;
      p.reviews[idx].comment = txt;
      p.reviews[idx].updatedAt = now;
      p.reviews[idx].createdAt = p.reviews[idx].createdAt || now;
    } else {
      p.reviews.push({
        user: userId,
        rating: r,
        comment: txt,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (typeof p.recomputeRatings === "function") p.recomputeRatings();
    await p.save();

    const reviews = (p.reviews || [])
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const userIds = Array.from(
      new Set(reviews.map((rv) => String(rv.user)).filter(Boolean)),
    );
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select("_id fullName")
          .lean()
      : [];
    const nameMap = new Map(
      users.map((u) => [String(u._id), u.fullName || ""]),
    );
    const myReview = reviews.find((rv) => String(rv.user) === userId) || null;

    return res.status(200).json({
      ok: true,
      data: {
        average: p.ratingAvg || 0,
        count: p.ratingCount || reviews.length,
        isOwner: String(p.user) === userId,
        reviews: reviews.map((rv) => ({
          id: String(rv.user),
          user: String(rv.user),
          userName: nameMap.get(String(rv.user)) || "Utilisateur",
          rating: rv.rating,
          comment: rv.comment,
          createdAt: toISO(rv.createdAt),
        })),
        myReview: myReview
          ? {
              id: String(myReview.user),
              user: String(myReview.user),
              userName: nameMap.get(String(myReview.user)) || "",
              rating: myReview.rating,
              comment: myReview.comment,
              createdAt: toISO(myReview.createdAt),
            }
          : null,
      },
    });
  } catch (e) {
    console.error(`[PROD ${rid}] POST /reviews ERROR: ${e?.stack || e}`);
    return res
      .status(500)
      .json({ ok: false, error: "Enregistrement de l’avis impossible" });
  }
});

/* ============ NEW: secure download on /marketplace/products/:id/download ============ */
router.get("/:id/download", requireAuth, async (req, res) => {
  const rid = req._rid;
  try {
    const p = await Product.findOne({ _id: req.params.id, deletedAt: null })
      .select("_id user fileUrl fileName fileMime")
      .lean();

    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    const allowed = await userCanDownload(req.auth.userId, p);
    if (!allowed)
      return res.status(403).json({ ok: false, error: "Accès refusé" });

    if (!p.fileUrl)
      return res.status(404).json({ ok: false, error: "Fichier absent" });

    const mime = p.fileMime || "application/octet-stream";
    const disp = contentDisposition(p.fileName, mime);
    res.set("Cache-Control", "no-store");

    await streamWithRedirects(p.fileUrl, res, {
      contentType: mime,
      disposition: disp,
    });
  } catch (e) {
    console.error(`[PROD ${rid}] DOWNLOAD ERROR:`, e?.stack || e);
    if (!res.headersSent)
      res.status(500).json({ ok: false, error: "Téléchargement impossible" });
  }
});

module.exports = router;
