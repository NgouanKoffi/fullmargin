const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");

const Product = require("../../models/product.model");
const Shop = require("../../models/shop.model");

// upload Bunny/Cloudinary (selon ton storage)
const { uploadImageBuffer } = require("../../utils/storage");

/* sharp optionnel (srcset) */
let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

const toISO = (d) => {
  try {
    return (d instanceof Date ? d : new Date(d)).toISOString();
  } catch {
    return "";
  }
};
const asInt = (v, dflt) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : dflt;
};
const str = (v) => (typeof v === "string" ? v.trim() : "");

const MAX_DATAURL_BYTES = 8 * 1024 * 1024; // 8MB sécurité

function randId() {
  return crypto.randomBytes(4).toString("hex");
}
function clampStr(v, max) {
  return String(v || "")
    .trim()
    .slice(0, max);
}
function isHttpUrl(u = "") {
  return /^https?:\/\//i.test(String(u).trim());
}
function isOkUrl(u = "") {
  const s = String(u || "").trim();
  return !!s && (isHttpUrl(s) || s.startsWith("/"));
}
function parseDataUrl(dataUrl = "") {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(String(dataUrl).trim());
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}

const SRCSET_SIZES = [
  { key: "320", w: 320, q: 72 },
  { key: "640", w: 640, q: 75 },
  { key: "960", w: 960, q: 78 },
  { key: "1280", w: 1280, q: 80 },
];

/**
 * Upload d’une cover depuis un buffer.
 */
async function uploadCoverFromBuffer(buffer, productId) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { imageUrl: "", image: null };
  }

  // si sharp pas dispo => 1 upload
  if (!sharp) {
    const publicId = `products/legacy/cover_${Date.now()}_${randId()}`;
    const up = await uploadImageBuffer(buffer, {
      folder: "marketplace/products/images",
      publicId,
    });
    const url = up?.secure_url || "";
    if (!url) return { imageUrl: "", image: null };
    await Product.updateOne(
      { _id: productId },
      { $set: { imageUrl: url }, $currentDate: { updatedAt: true } },
    );
    return { imageUrl: url, image: null };
  }

  // sharp dispo => variants
  const meta = await sharp(buffer)
    .rotate()
    .metadata()
    .catch(() => ({}));
  const srcset = {};
  let src = "";

  const baseId = `products/legacy/cover_${Date.now()}_${randId()}`;

  for (const v of SRCSET_SIZES) {
    const out = await sharp(buffer)
      .rotate()
      .resize({ width: v.w, withoutEnlargement: true })
      .webp({ quality: v.q })
      .toBuffer();

    const up = await uploadImageBuffer(out, {
      folder: "marketplace/products/images",
      publicId: `${baseId}_${v.key}`,
    });

    const url = up?.secure_url || "";
    if (url) {
      srcset[v.key] = url;
      if (v.key === "640") src = url;
    }
  }

  if (!src) src = srcset["320"] || srcset["960"] || srcset["1280"] || "";
  if (!src) return { imageUrl: "", image: null };

  const image = {
    src,
    srcset,
    w: meta?.width ?? null,
    h: meta?.height ?? null,
    format: "webp",
  };

  await Product.updateOne(
    { _id: productId },
    {
      $set: { imageUrl: src, image },
      $currentDate: { updatedAt: true },
    },
  );

  return { imageUrl: src, image };
}

/**
 * ✅ Normalise l'image principale et la galerie
 */
async function normalizeImagesAndMaybeMigrate(pDoc) {
  const p = pDoc || {};

  // 0) si image déjà structurée en DB, on la garde (fallback sur imageUrl)
  const existingImage =
    p.image && typeof p.image === "object" && isOkUrl(p.image.src)
      ? {
          src: String(p.image.src || "").trim(),
          srcset:
            p.image.srcset && typeof p.image.srcset === "object"
              ? p.image.srcset
              : {},
          w: Number.isFinite(Number(p.image.w)) ? Number(p.image.w) : null,
          h: Number.isFinite(Number(p.image.h)) ? Number(p.image.h) : null,
          format: String(p.image.format || ""),
        }
      : null;

  let imageUrl = String(p.imageUrl || "").trim();
  let image = existingImage;

  // gallery propre
  const srcGallery = Array.isArray(p.gallery)
    ? p.gallery.map((u) => String(u || "").trim()).filter(Boolean)
    : [];

  // legacy images
  const legacyImages = Array.isArray(p.images)
    ? p.images.map((u) => String(u || "").trim()).filter(Boolean)
    : [];

  // 1) MIGRATION cover
  if (!image && /^data:/i.test(imageUrl)) {
    const parsed = parseDataUrl(imageUrl);
    if (
      parsed &&
      parsed.mime &&
      parsed.mime.startsWith("image/") &&
      parsed.buffer.length <= MAX_DATAURL_BYTES
    ) {
      try {
        const migrated = await uploadCoverFromBuffer(parsed.buffer, p._id);
        imageUrl = migrated.imageUrl || "";
        image = migrated.image || null;
      } catch {
        imageUrl = "";
      }
    } else {
      imageUrl = "";
    }
  }

  // 2) MIGRATION gallery data:
  let galleryChanged = false;
  const nextGallery = [];
  for (const u of srcGallery) {
    if (!u) continue;

    if (isOkUrl(u)) {
      nextGallery.push(clampStr(u, 500000));
      continue;
    }

    if (/^data:/i.test(u)) {
      const parsed = parseDataUrl(u);
      if (
        parsed &&
        parsed.mime &&
        parsed.mime.startsWith("image/") &&
        parsed.buffer.length <= MAX_DATAURL_BYTES
      ) {
        try {
          const publicId = `products/legacy/gallery_${Date.now()}_${randId()}`;
          const up = await uploadImageBuffer(parsed.buffer, {
            folder: "marketplace/products/gallery",
            publicId,
          });
          if (up?.secure_url) {
            nextGallery.push(up.secure_url);
            galleryChanged = true;
          } else {
            galleryChanged = true;
          }
        } catch {
          galleryChanged = true;
        }
      } else {
        galleryChanged = true;
      }
      continue;
    }
    galleryChanged = true;
  }

  if (galleryChanged) {
    try {
      await Product.updateOne(
        { _id: p._id },
        { $set: { gallery: nextGallery }, $currentDate: { updatedAt: true } },
      );
    } catch {
      // ignore
    }
  }

  // 3) images[] final pour le front
  const images = [];
  const main = (image && image.src) || imageUrl;
  if (main && isOkUrl(main)) images.push(main);

  const extra = legacyImages.length ? legacyImages : nextGallery;
  for (const u of extra) {
    const v = String(u || "").trim();
    if (!v) continue;
    if (v === main) continue;
    if (isOkUrl(v)) images.push(v);
  }

  return {
    imageUrl: main && isOkUrl(main) ? main : "",
    image: image || null,
    gallery: nextGallery.filter((u) => isOkUrl(u)),
    images,
  };
}

/** GET /api/marketplace/public/products
 * A) ?ids=ID1,ID2
 * B) listing filtrable (?q, ?type, ?shop, ?category, ?limit, ?page, ?featuredFirst=1, ?featuredOnly=1)
 */
router.get("/", async (req, res) => {
  try {
    /* A) via liste d'IDs (pas de pagination ici généralement) */
    const idsParam = str(req.query.ids);
    if (idsParam) {
      const rawIds = idsParam
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (rawIds.length === 0) {
        res.set("Cache-Control", "no-store");
        return res
          .status(200)
          .json({ ok: true, data: { items: [], total: 0 } });
      }

      const rows = await Product.find({
        _id: { $in: rawIds },
        status: "published",
        deletedAt: null,
      })
        .select(
          "_id title shortDescription type imageUrl image pricing shop updatedAt ratingAvg ratingCount badgeEligible featured gallery images",
        )
        .lean();

      const order = new Map(rawIds.map((id, idx) => [String(id), idx]));
      rows.sort(
        (a, b) =>
          (order.get(String(a._id)) ?? 999999) -
          (order.get(String(b._id)) ?? 999999),
      );

      const shopIds = Array.from(
        new Set(rows.map((r) => String(r.shop)).filter(Boolean)),
      );
      let shopMap = new Map();
      if (shopIds.length) {
        const shops = await Shop.find({
          _id: { $in: shopIds },
          deletedAt: null,
        })
          .select("_id name slug avatarUrl")
          .lean();
        shopMap = new Map(shops.map((s) => [String(s._id), s]));
      }

      const items = [];
      for (const p of rows) {
        const s = shopMap.get(String(p.shop));
        const norm = await normalizeImagesAndMaybeMigrate(p);

        items.push({
          id: String(p._id),
          title: p.title,
          shortDescription: p.shortDescription,
          type: p.type,
          imageUrl: norm.imageUrl || "",
          image: norm.image,
          images: norm.images,
          pricing: p.pricing,
          updatedAt: toISO(p.updatedAt),
          ratingAvg: p.ratingAvg || 0,
          ratingCount: p.ratingCount || 0,
          badgeEligible: !!p.badgeEligible,
          featured: !!p.featured,
          shop: s
            ? {
                id: String(s._id),
                name: s.name,
                slug: s.slug || "",
                avatarUrl: s.avatarUrl || "",
              }
            : null,
        });
      }

      res.set("Cache-Control", "no-store");
      return res
        .status(200)
        .json({ ok: true, data: { items, total: items.length } });
    }

    /* B) listing public filtrable AVEC PAGINATION */
    const q = str(req.query.q);
    const type = str(req.query.type);
    const shopKey = str(req.query.shop);
    const categoryKey = str(req.query.category);

    const featuredFirst = ["1", "true", "yes"].includes(
      String(req.query.featuredFirst || "").toLowerCase(),
    );
    const featuredOnly = ["1", "true", "yes"].includes(
      String(req.query.featuredOnly || "").toLowerCase(),
    );

    const ALLOWED_TYPES = new Set([
      "robot_trading",
      "indicator",
      "mt4_mt5",
      "ebook_pdf",
      "template_excel",
    ]);
    const filter = { deletedAt: null, status: "published" };

    if (q)
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
      ];
    if (ALLOWED_TYPES.has(type)) filter.type = type;
    if (categoryKey) filter.category = categoryKey;
    if (featuredOnly) filter.featured = true;

    let shopDoc = null;
    if (shopKey) {
      shopDoc =
        (await Shop.findOne({ slug: shopKey, deletedAt: null })
          .select("_id name slug avatarUrl")
          .lean()) ||
        (await Shop.findOne({ _id: shopKey, deletedAt: null })
          .select("_id name slug avatarUrl")
          .lean());

      if (!shopDoc)
        return res
          .status(404)
          .json({ ok: false, error: "Boutique introuvable" });

      filter.shop = shopDoc._id;
    }

    // --- PAGINATION START ---
    const page = Math.max(asInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(asInt(req.query.limit, 24), 1), 60);
    const skip = (page - 1) * limit;
    // --- PAGINATION END ---

    const sort = featuredFirst
      ? { featured: -1, updatedAt: -1, _id: -1 }
      : { updatedAt: -1, _id: -1 };

    // 1. Compter le total (pour la pagination)
    const total = await Product.countDocuments(filter);

    // 2. Récupérer la page actuelle
    const rows = await Product.find(filter)
      .sort(sort)
      .skip(skip) // <-- SAUT DES PAGES PRÉCÉDENTES
      .limit(limit) // <-- LIMITE PAR PAGE
      .select(
        "_id title shortDescription type imageUrl image pricing shop updatedAt ratingAvg ratingCount badgeEligible featured gallery images",
      )
      .lean();

    const shopIds =
      shopDoc == null
        ? Array.from(new Set(rows.map((r) => String(r.shop)).filter(Boolean)))
        : [String(shopDoc._id)];

    let shopMap = new Map();
    if (shopIds.length) {
      const shops = await Shop.find({ _id: { $in: shopIds }, deletedAt: null })
        .select("_id name slug avatarUrl")
        .lean();
      shopMap = new Map(shops.map((s) => [String(s._id), s]));
    }

    const items = [];
    for (const p of rows) {
      const s = shopMap.get(String(p.shop));
      const norm = await normalizeImagesAndMaybeMigrate(p);

      items.push({
        id: String(p._id),
        title: p.title,
        shortDescription: p.shortDescription,
        type: p.type,

        imageUrl: norm.imageUrl || "",
        image: norm.image,
        images: norm.images,

        pricing: p.pricing,
        updatedAt: toISO(p.updatedAt),
        ratingAvg: p.ratingAvg || 0,
        ratingCount: p.ratingCount || 0,
        badgeEligible: !!p.badgeEligible,
        featured: !!p.featured,

        shop: s
          ? {
              id: String(s._id),
              name: s.name,
              slug: s.slug || "",
              avatarUrl: s.avatarUrl || "",
            }
          : null,
      });
    }

    res.set("Cache-Control", "no-store");
    // Retourne le total pour que le front puisse afficher les pages (1, 2, 3...)
    return res.status(200).json({
      ok: true,
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("[PUBLIC PRODUCTS] GET ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement des produits impossible" });
  }
});

/** GET /api/marketplace/public/products/:id */
router.get("/:id", async (req, res) => {
  try {
    const id = str(req.params.id);
    const p = await Product.findOne({
      _id: id,
      status: "published",
      deletedAt: null,
    })
      .select(
        "_id title shortDescription longDescription category type imageUrl image gallery videoUrls fileUrl fileName fileMime pricing shop createdAt updatedAt ratingAvg ratingCount badgeEligible featured",
      )
      .lean()
      .exec();

    if (!p)
      return res.status(404).json({ ok: false, error: "Produit introuvable" });

    let shop = null;
    if (p.shop) {
      const s = await Shop.findOne({ _id: p.shop, deletedAt: null })
        .select("_id name slug")
        .lean()
        .exec();
      if (s) shop = { id: String(s._id), name: s.name, slug: s.slug || "" };
    }

    const norm = await normalizeImagesAndMaybeMigrate(p);

    const data = {
      id: String(p._id),
      title: p.title,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription,
      category: p.category || "",
      type: p.type,

      imageUrl: norm.imageUrl || "",
      image: norm.image, // ✅ src/srcset si dispo
      images: norm.images,
      gallery: norm.gallery,

      videoUrls: Array.isArray(p.videoUrls)
        ? p.videoUrls.map((u) => String(u || "")).filter(Boolean)
        : [],

      fileUrl: p.fileUrl || "",
      fileName: p.fileName || "",
      fileMime: p.fileMime || "",

      pricing: p.pricing,
      badgeEligible: !!p.badgeEligible,
      featured: !!p.featured,
      shop,

      createdAt: toISO(p.createdAt),
      updatedAt: toISO(p.updatedAt),
      ratingAvg: p.ratingAvg || 0,
      ratingCount: p.ratingCount || 0,
    };

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error("[PUBLIC PRODUCT] GET/:id ERROR:", e?.stack || e);
    return res
      .status(500)
      .json({ ok: false, error: "Chargement du produit impossible" });
  }
});

module.exports = router;
