// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\publicShopApi.ts
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ---------- Types ---------- */

export type Pricing =
  | { mode: "one_time"; amount: number }
  | { mode: "subscription"; amount: number; interval: "month" | "year" };

/** ✅ Image responsive (src + srcset) */
export type ProductImage = {
  src: string;
  /** ex: { "320": "https://...", "640": "https://..." } */
  srcset?: Record<string, string>;
  w?: number | null;
  h?: number | null;
  format?: string;
};

/* ---------- Rich text (éditeur JSON) ---------- */

type RichTextContentNode = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

export type RichTextBlock = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: RichTextContentNode[];
  children?: RichTextBlock[];
  [key: string]: unknown;
};

export type PublicShop = {
  id: string;
  name: string;
  desc: string;
  signature: string;
  avatarUrl: string;
  coverUrl: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    products?: number;
    followers?: number;
    ratingAvg?: number;
    ratingCount?: number;
  };
};

export type PublicProductLite = {
  id: string;
  title: string;
  shortDescription: string;
  type:
    | "robot_trading"
    | "indicator"
    | "mt4_mt5"
    | "ebook_pdf"
    | "template_excel";

  /** legacy */
  imageUrl?: string;

  /** ✅ images carrousel (strings) */
  images?: string[];

  /** ✅ image responsive (src + srcset) */
  image?: ProductImage | null;

  pricing:
    | { mode: "one_time"; amount: number }
    | { mode: "subscription"; amount: number; interval: "month" | "year" };

  updatedAt?: string;

  ratingAvg?: number;
  ratingCount?: number;

  badgeEligible?: boolean;
  featured?: boolean;

  shop?: { id: string; name: string; slug?: string; avatarUrl?: string } | null;
};

export type PublicProductFull = PublicProductLite & {
  longDescription: string;

  longDescriptionJson?: RichTextBlock[];
  shortDescriptionJson?: RichTextBlock[];

  category?: string;

  gallery?: string[];
  videoUrls?: string[];

  fileUrl?: string;
  fileName?: string;
  fileMime?: string;

  shop?: { id: string; name: string; slug?: string; avatarUrl?: string } | null;
  createdAt?: string;

  status?: "draft" | "pending" | "published" | "rejected" | "suspended";
  moderationReason?: string;
};

/** Catégorie publique minimale (pour la sidebar) */
export type PublicCategoryLite = { key: string; label: string };

/* ---------- Helpers ---------- */

function authHeaders(): Headers {
  const h = new Headers();
  const s = loadSession();
  if (s?.token) h.set("Authorization", `Bearer ${s.token}`);
  h.set("Cache-Control", "no-store");
  return h;
}

function isRecord(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v != null ? String(v) : "";
}

function coerceType(v: unknown): PublicProductFull["type"] {
  const t = String(v ?? "");
  const ALLOWED: PublicProductFull["type"][] = [
    "robot_trading",
    "indicator",
    "mt4_mt5",
    "ebook_pdf",
    "template_excel",
  ];
  return ALLOWED.includes(t as PublicProductFull["type"])
    ? (t as PublicProductFull["type"])
    : "ebook_pdf";
}

export type PricingUnion = Pricing;

function coercePricing(v: unknown): PricingUnion {
  if (isRecord(v)) {
    const mode = v["mode"] === "subscription" ? "subscription" : "one_time";
    const amount = Number(v["amount"] ?? 0);
    if (mode === "subscription") {
      const interval = v["interval"] === "year" ? "year" : "month";
      return { mode, amount, interval };
    }
    return { mode, amount };
  }
  return { mode: "one_time", amount: 0 };
}

function coerceProductImage(u: unknown): ProductImage | null {
  if (!isRecord(u)) return null;
  const src = str(u["src"]);
  if (!src) return null;

  let srcset: Record<string, string> | undefined;
  const rawSrcset = u["srcset"];
  if (isRecord(rawSrcset)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawSrcset)) {
      const key = String(k).trim();
      const url = str(v);
      if (!key || !url) continue;
      out[key] = url;
    }
    if (Object.keys(out).length) srcset = out;
  }

  const wNum = Number(u["w"]);
  const hNum = Number(u["h"]);
  const w = Number.isFinite(wNum) ? wNum : null;
  const h = Number.isFinite(hNum) ? hNum : null;

  const format = u["format"] != null ? str(u["format"]) : undefined;

  return { src, srcset, w, h, format };
}

function uniqStrings(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    const s = String(raw || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/* ---------- Rich text helper (JSON -> texte) ---------- */

function parseRichTextMaybe(raw: unknown): {
  text: string;
  json?: RichTextBlock[];
} {
  // ✅ CAS 1 : déjà un tableau JSON
  if (Array.isArray(raw)) {
    const blocks = raw as RichTextBlock[];
    const texts: string[] = [];

    const walk = (nodes: RichTextBlock[]) => {
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;

        if (Array.isArray(node.content)) {
          for (const c of node.content) {
            if (isRecord(c) && typeof c["text"] === "string") {
              texts.push(c["text"]);
            }
          }
        }

        if (Array.isArray(node.children) && node.children.length) {
          walk(node.children);
        }
      }
    };

    walk(blocks);

    const plain = texts.join(" ").replace(/\s+/g, " ").trim();
    return { text: plain || "", json: blocks };
  }

  // ✅ CAS 2 : string brute (ou autre)
  const s = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
  let trimmed = s.trim();
  if (!trimmed) return { text: "", json: undefined };

  // 🔥 string qui contient du JSON entre guillemets
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // ✅ CAS 3 : string qui ressemble à un tableau JSON
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const blocks = parsed as RichTextBlock[];
        const texts: string[] = [];

        const walk = (nodes: RichTextBlock[]) => {
          for (const node of nodes) {
            if (!node || typeof node !== "object") continue;

            if (Array.isArray(node.content)) {
              for (const c of node.content) {
                if (isRecord(c) && typeof c["text"] === "string") {
                  texts.push(c["text"]);
                }
              }
            }

            if (Array.isArray(node.children) && node.children.length) {
              walk(node.children);
            }
          }
        };

        walk(blocks);

        const plain = texts.join(" ").replace(/\s+/g, " ").trim();
        return { text: plain || trimmed, json: blocks };
      }
    } catch {
      // parse échoué → on garde la string brute
    }
  }

  return { text: trimmed, json: undefined };
}

/* ---------- Normalisation produit ---------- */

function normalizeToPublic(p: unknown): PublicProductFull {
  const r: Record<string, unknown> = isRecord(p) ? p : {};

  // ✅ image responsive
  const image = coerceProductImage(r["image"]);

  // galerie & vidéos
  const rawGallery = r["gallery"];
  const gallery = Array.isArray(rawGallery)
    ? rawGallery.map((x) => str(x)).filter(Boolean)
    : [];

  const rawVideoUrls = r["videoUrls"];
  const videoUrls = Array.isArray(rawVideoUrls)
    ? rawVideoUrls.map((x) => str(x)).filter(Boolean)
    : [];

  // images
  const rawImages = r["images"];
  const mainImage =
    image?.src || (r["imageUrl"] != null ? str(r["imageUrl"]) : "");

  let images: string[] = [];
  if (Array.isArray(rawImages) && rawImages.length) {
    images = rawImages.map((x) => str(x)).filter(Boolean);
  } else if (gallery.length || mainImage) {
    images = [mainImage, ...gallery].filter(Boolean);
  }
  images = uniqStrings(images);

  // shop
  let shop: PublicProductFull["shop"] = null;
  const rawShop = r["shop"];
  if (isRecord(rawShop)) {
    const sid = str(rawShop["id"] ?? rawShop["_id"]);
    const name = str(rawShop["name"]);
    const slug = str(rawShop["slug"]);
    const avatarUrl = str(rawShop["avatarUrl"]);
    if (sid || name || slug) {
      shop = {
        id: sid,
        name,
        slug: slug || undefined,
        avatarUrl: avatarUrl || undefined,
      };
    }
  }

  // moderation reason
  let moderationReason: string | undefined;
  const rawModeration = r["moderation"];
  if (isRecord(rawModeration) && rawModeration["reason"] != null) {
    moderationReason = str(rawModeration["reason"]);
  } else if (r["moderationReason"] != null) {
    moderationReason = str(r["moderationReason"]);
  }

  const pricing = coercePricing(r["pricing"]);

  const beRaw = r["badgeEligible"];
  const badgeEligible = typeof beRaw === "boolean" ? beRaw : !!beRaw;

  const ratingAvgRaw = r["ratingAvg"];
  const ratingCountRaw = r["ratingCount"];

  // parse rich text
  const shortParsed = parseRichTextMaybe(r["shortDescription"]);
  const longParsed = parseRichTextMaybe(r["longDescription"]);

  const out: PublicProductFull = {
    id: str(r["id"] ?? r["_id"]),
    title: str(r["title"]),

    shortDescription: shortParsed.text,
    longDescription: longParsed.text,

    shortDescriptionJson: shortParsed.json,
    longDescriptionJson: longParsed.json,

    type: coerceType(r["type"]),

    imageUrl: str(r["imageUrl"]),
    images,
    image: image || undefined,

    gallery,
    videoUrls,
    category: r["category"] != null ? str(r["category"]) : undefined,

    pricing,

    fileUrl: r["fileUrl"] ? str(r["fileUrl"]) : undefined,
    fileName: r["fileName"] ? str(r["fileName"]) : undefined,
    fileMime: r["fileMime"] ? str(r["fileMime"]) : undefined,

    badgeEligible,

    shop,

    createdAt: r["createdAt"] ? str(r["createdAt"]) : undefined,
    updatedAt: r["updatedAt"] ? str(r["updatedAt"]) : undefined,

    status: r["status"]
      ? (str(r["status"]) as PublicProductFull["status"])
      : undefined,

    moderationReason: moderationReason || undefined,

    ratingAvg: typeof ratingAvgRaw === "number" ? ratingAvgRaw : undefined,
    ratingCount:
      typeof ratingCountRaw === "number" ? ratingCountRaw : undefined,

    featured: r["featured"] ? !!r["featured"] : undefined,
  };

  // fallback images si vide mais image.src ou imageUrl existe
  if (
    (!out.images || out.images.length === 0) &&
    (out.image?.src || out.imageUrl)
  ) {
    out.images = uniqStrings([out.image?.src || "", out.imageUrl || ""]);
  }

  return out;
}

function normalizeToLite(p: unknown): PublicProductLite {
  const full = normalizeToPublic(p);
  return {
    id: full.id,
    title: full.title,
    shortDescription: full.shortDescription,
    type: full.type,
    imageUrl: full.imageUrl,
    images: full.images,
    image: full.image ?? undefined,
    pricing: full.pricing,
    updatedAt: full.updatedAt,
    ratingAvg: full.ratingAvg,
    ratingCount: full.ratingCount,
    badgeEligible: full.badgeEligible,
    featured: full.featured,
    shop: full.shop ?? null,
  };
}

/* ---------- Reviews (public) ---------- */
export type ProductReview = {
  id: string;
  user: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductReviewsPayload = {
  average: number;
  count: number;
  reviews: ProductReview[];
};

function coerceProductReview(u: unknown): ProductReview | null {
  if (!isRecord(u)) return null;
  const user = str(u["user"]);
  if (!user) return null;
  const id = str(u["id"] || u["user"]);
  const userName = str(u["userName"]);
  const ratingNum = Number(u["rating"]);
  const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
  const comment = typeof u["comment"] === "string" ? u["comment"] : "";
  const createdAt = str(u["createdAt"]);
  return { id: id || user, user, userName, rating, comment, createdAt };
}

export async function getProductReviews(
  productId: string
): Promise<ProductReviewsPayload> {
  const res = await fetch(
    `${API_BASE}/marketplace/products/${encodeURIComponent(productId)}/reviews`,
    { cache: "no-store" }
  );
  if (!res.ok) return { average: 0, count: 0, reviews: [] };

  const json: unknown = await res.json();

  let average = 0;
  let count = 0;
  let reviews: ProductReview[] = [];

  if (isRecord(json)) {
    const rawData = json["data"];
    if (isRecord(rawData)) {
      average = typeof rawData["average"] === "number" ? rawData["average"] : 0;
      count = typeof rawData["count"] === "number" ? rawData["count"] : 0;

      const rawReviews = rawData["reviews"];
      if (Array.isArray(rawReviews)) {
        reviews = rawReviews
          .map((r) => coerceProductReview(r))
          .filter((r): r is ProductReview => r !== null);
      }
    }
  }

  return { average, count, reviews };
}

/** Review de boutique (review + contexte produit) */
export type ShopReview = {
  productId: string;
  productTitle: string;
  productImageUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId: string;
  userName: string;
};

async function mapLimit<T, U>(
  arr: T[],
  limit: number,
  mapper: (v: T, i: number) => Promise<U>
): Promise<U[]> {
  const ret: U[] = new Array(arr.length);
  let i = 0;
  let running = 0;

  let resolve!: (v: U[]) => void;
  const done = new Promise<U[]>((res) => {
    resolve = res;
  });

  const next = () => {
    if (i >= arr.length && running === 0) return resolve(ret);
    while (running < limit && i < arr.length) {
      const idx = i++;
      running++;
      mapper(arr[idx], idx)
        .then((v) => {
          ret[idx] = v;
        })
        .catch((e) => {
          // @ts-expect-error: on laisse undefined en cas d'erreur
          ret[idx] = undefined;
          console.warn("[listPublicShopReviews] review fetch error:", e);
        })
        .finally(() => {
          running--;
          next();
        });
    }
  };

  next();
  return done;
}

export async function listPublicShopReviews(
  slugOrId: string
): Promise<ShopReview[]> {
  const prods = await listPublicShopProducts(slugOrId);
  if (!prods.length) return [];

  const reviewsPayloads = await mapLimit(prods, 6, (p) =>
    getProductReviews(p.id)
  );

  const out: ShopReview[] = [];
  for (let i = 0; i < prods.length; i++) {
    const p = prods[i];
    const pay = reviewsPayloads[i] || { reviews: [] as ProductReview[] };

    for (const r of pay.reviews || []) {
      out.push({
        productId: p.id,
        productTitle: p.title,
        productImageUrl: p.image?.src || p.imageUrl || p.images?.[0] || "",
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userId: r.user,
        userName: r.userName,
      });
    }
  }

  out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return out;
}

/* ---------- Shops (public) ---------- */

export async function listPublicShops(): Promise<PublicShop[]> {
  try {
    const res = await fetch(`${API_BASE}/marketplace/public/shops`, {
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const data = isRecord(json) ? json["data"] : null;
    const items = isRecord(data) ? data["items"] : null;

    return Array.isArray(items) ? (items as PublicShop[]) : [];
  } catch (e) {
    console.warn("[listPublicShops] failed:", e);
    return [];
  }
}

export async function getPublicShop(
  slugOrId: string
): Promise<PublicShop | null> {
  // 1) endpoint direct
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/public/shops/${encodeURIComponent(slugOrId)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const json: unknown = await res.json();
      const data = isRecord(json) ? json["data"] : null;
      const shop = isRecord(data) ? data["shop"] : null;
      return (shop as PublicShop) ?? null;
    }
  } catch (e) {
    console.warn("[getPublicShop] direct endpoint failed:", e);
  }

  // 2) fallback liste
  try {
    const all = await listPublicShops();
    return all.find((s) => s.slug === slugOrId || s.id === slugOrId) ?? null;
  } catch (e) {
    console.error("[getPublicShop] fallback failed:", e);
    return null;
  }
}

export async function listPublicShopProducts(
  slugOrId: string
): Promise<PublicProductLite[]> {
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/public/shops/${encodeURIComponent(
        slugOrId
      )}/products`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const data = isRecord(json) ? json["data"] : null;
    const items = isRecord(data) ? data["items"] : null;
    if (!Array.isArray(items)) return [];

    return (items as unknown[]).map((it) => normalizeToLite(it));
  } catch (e) {
    console.error("[listPublicShopProducts] failed:", e);
    return [];
  }
}

/* ---------- Produit (public) ---------- */

export async function getPublicProduct(id: string): Promise<PublicProductFull> {
  const res = await fetch(`${API_BASE}/marketplace/public/products/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Produit introuvable");

  const json: unknown = await res.json();
  const data = isRecord(json) ? json["data"] : null;
  if (!data) throw new Error("Produit introuvable");

  const p = normalizeToPublic(data);
  return { ...p, status: "published" };
}

export async function getPreviewProduct(
  id: string
): Promise<PublicProductFull> {
  // 1) public
  try {
    return await getPublicProduct(id);
  } catch {
    // continue
  }

  // 2) privé (créateur)
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/products/${encodeURIComponent(
        id
      )}?includeDeleted=1`,
      { headers: authHeaders() }
    );
    if (res.ok) {
      const json: unknown = await res.json();
      const data = isRecord(json) ? json["data"] : null;

      if (isRecord(data) && data["product"] != null) {
        return normalizeToPublic(data["product"]);
      }
      if (data != null) {
        return normalizeToPublic(data);
      }
    }
  } catch {
    // continue
  }

  // 3) admin/agent
  try {
    const res = await fetch(
      `${API_BASE}/admin/marketplace/products/${encodeURIComponent(id)}`,
      { headers: authHeaders() }
    );
    if (res.ok) {
      const json: unknown = await res.json();
      const data = isRecord(json) ? json["data"] : null;

      if (isRecord(data) && data["product"] != null) {
        return normalizeToPublic(data["product"]);
      }
      if (data != null) {
        return normalizeToPublic(data);
      }
    }
  } catch {
    // continue
  }

  throw new Error("Produit introuvable ou non accessible");
}

/* ---------- PROMOS (public) ---------- */

export type PromoValidateRes =
  | {
      ok: true;
      data: {
        valid: boolean;
        reason?: string;
        scope?: "global" | "category" | "product" | "shop";
        type?: "percent" | "amount";
        value?: number;
        pricing?: {
          original: Pricing;
          final: Pricing;
          discount: number;
        };
        meta?: {
          productId: string;
          categoryKey: string | null;
          shopId: string | null;
          startsAt: string | null;
          endsAt: string | null;
          maxUse: number | null;
          used: number;
        };
      };
    }
  | { ok: false; error: string };

export async function validatePublicPromo(
  code: string,
  productId: string
): Promise<PromoValidateRes> {
  const res = await fetch(`${API_BASE}/marketplace/public/promos/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ code, productId }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as PromoValidateRes | null;
  if (!json) return { ok: false, error: "Validation impossible" };
  return json;
}

export function applyPromoToPricing(
  current: Pricing,
  validation: PromoValidateRes
): { final: Pricing; discount: number } {
  if (!validation.ok || !validation.data.valid || !validation.data.pricing) {
    return { final: current, discount: 0 };
  }
  return {
    final: validation.data.pricing.final,
    discount: validation.data.pricing.discount,
  };
}

/* ---------- Helpers URL ---------- */

export function publicShopUrl(slugOrId: string): string {
  return `/marketplace/public/shop/${encodeURIComponent(slugOrId)}`;
}
export function publicProductUrl(id: string): string {
  return `/marketplace/public/product/${encodeURIComponent(id)}`;
}

/* ---------- Catégories (public) ---------- */

function coerceCategoryLite(u: unknown): PublicCategoryLite | null {
  if (!isRecord(u)) return null;
  const key = str(u["key"]);
  const label = str(u["label"]);
  if (!key) return null;
  return { key, label };
}

function extractCategoryItems(json: unknown): PublicCategoryLite[] {
  if (!isRecord(json)) return [];
  const data = json["data"];
  if (!isRecord(data)) return [];
  const items = data["items"];
  if (!Array.isArray(items)) return [];
  return items
    .map((it: unknown) => coerceCategoryLite(it))
    .filter((c): c is PublicCategoryLite => c !== null);
}

export async function listPublicCategories(): Promise<PublicCategoryLite[]> {
  try {
    const res = await fetch(`${API_BASE}/marketplace/public/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    return extractCategoryItems(json);
  } catch {
    return [];
  }
}

/** ✅ Liste des produits “Mis en avant” (public) */
export async function listFeaturedPublicProducts(
  limit = 8
): Promise<PublicProductLite[]> {
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/public/products?featuredOnly=1&limit=${encodeURIComponent(
        String(limit)
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const data = isRecord(json) ? json["data"] : null;
    const items = isRecord(data) ? data["items"] : null;
    if (!Array.isArray(items)) return [];

    return (items as unknown[]).map((it) => ({
      ...normalizeToLite(it),
      featured: true,
    }));
  } catch (e) {
    console.warn("[listFeaturedPublicProducts] failed:", e);
    return [];
  }
}

/* ---------- Alias ---------- */
export { listPublicShopProducts as listProductsOfPublicShop };
