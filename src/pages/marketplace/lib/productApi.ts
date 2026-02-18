// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\productApi.ts
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ---------- Types ---------- */

export type Pricing =
  | { mode: "one_time"; amount: number }
  | { mode: "subscription"; amount: number; interval: "month" | "year" };

export type ProductType =
  | "robot_trading"
  | "indicator"
  | "mt4_mt5"
  | "ebook_pdf"
  | "template_excel";

export type ProductStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "suspended"; // cohérent avec le back

/** Catégories (lite) pour le formulaire utilisateur */
export type CategoryLite = {
  id: string;
  key: string;
  label: string;
  commissionPct: number;
};

/** Liste (light) */
export type ProductLite = {
  id: string;
  title: string;
  shortDescription: string;
  type: ProductType;
  imageUrl?: string;
  fileName?: string;
  pricing: Pricing;
  status: ProductStatus;
  /** 🆕 infos modération (renvoyées par le back) */
  moderationReason?: string;
  moderationReviewedAt?: string | null;

  badgeEligible?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** Avis */
export type ProductReview = {
  id: string;
  user: string;
  userName?: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string; // ISO
};

export type ReviewsPayload = {
  average: number;
  count: number;
  reviews: ProductReview[];
  myReview: ProductReview | null;
  isOwner?: boolean;
};

/** Détail (édition/preview) */
/** Détail (édition/preview) */
export type ProductFull = ProductLite & {
  longDescription: string;
  category?: string;
  /** fichier téléchargeable (si concerné) */
  fileUrl?: string;
  fileMime?: string;
  /** accepté CGU marketplace */
  termsAccepted: boolean;
  shop?: { id: string; name: string; slug?: string } | null;

  /** 🖼️ Images / galerie */
  images?: string[]; // ce que renvoie potentiellement le back
  gallery?: string[]; // champ utilisé côté front (MediaSection)

  /** 🎥 Vidéos associées au produit */
  videoUrls?: string[];

  ratingAvg?: number;
  ratingCount?: number;
};

/* ---------- Helpers internes ---------- */

function authHeaders(): Headers {
  const h = new Headers();
  const s = loadSession();
  if (s?.token) h.set("Authorization", `Bearer ${s.token}`);
  return h;
}

/** Convertit un File en dataURL (sans any) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
    r.onerror = () =>
      reject(r.error ?? new Error("Lecture du fichier échouée"));
    r.readAsDataURL(file);
  });
}

/* ---------- Enveloppes & types de payload ---------- */
type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

type CategoriesPayload = {
  items: Array<{
    id?: string;
    _id?: string;
    key?: string;
    label?: string;
    commissionPct?: number;
  }>;
};

type MyProductsPayload = { items: ProductLite[] };

/* ---------- Type guards ---------- */
function isObject(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}
function isApiOk<T>(u: unknown): u is ApiOk<T> {
  if (!isObject(u)) return false;
  return (u as { ok?: unknown }).ok === true && "data" in u;
}

/* ---------- Catégories (utilisateur) ---------- */
/** GET /marketplace/categories → { ok, data: { items } } */
export async function listUserCategories(): Promise<CategoryLite[]> {
  const headers = authHeaders(); // autorisé même sans token
  const res = await fetch(`${API_BASE}/marketplace/categories`, { headers });
  if (!res.ok) {
    // ne bloque pas le formulaire
    return [];
  }

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = isApiOk<CategoriesPayload>(raw) ? raw.data : null;
  const items = data?.items ?? [];

  return (Array.isArray(items) ? items : [])
    .map((c) => ({
      id: String(c.id ?? c._id ?? ""),
      key: String(c.key ?? ""),
      label: String(c.label ?? ""),
      commissionPct: Number(c.commissionPct ?? 0),
    }))
    .filter((c) => c.id && c.key && c.label);
}

/* ---------- Produits (privés) ---------- */

export async function listMyProducts(): Promise<ProductLite[]> {
  const res = await fetch(`${API_BASE}/marketplace/products`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load products");

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = isApiOk<MyProductsPayload>(raw) ? raw.data : null;
  return data?.items ?? [];
}

export type CreateProductPayload = {
  title: string;
  shortDescription: string;
  longDescription: string;
  category?: string;
  type: ProductType;
  imageUrl?: string;

  /** 🖼️ Galerie d’images */
  gallery?: string[];

  /** 🎥 Vidéos (dataURL ou liens) */
  videoUrls?: string[];

  /** soit fileUrl prêt à l’emploi, soit fileDataUrl pour que le backend uploade */
  fileUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileMime?: string;
  pricing: Pricing;
  termsAccepted: boolean;
};

export async function createProduct(payload: CreateProductPayload) {
  const headers = authHeaders();
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE}/marketplace/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Création impossible");
  }
  const raw = (await res.json().catch(() => null)) as unknown as ApiRes<{
    id: string;
    status: ProductStatus;
    updatedAt?: string;
  }>;
  if (!isApiOk<{ id: string; status: ProductStatus; updatedAt?: string }>(raw))
    throw new Error("Réponse invalide");
  return raw.data;
}

export async function patchProduct(
  id: string,
  patch: Record<string, unknown> // peut contenir fileDataUrl
) {
  const headers = authHeaders();
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE}/marketplace/products/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Sauvegarde impossible");

  const raw = (await res.json().catch(() => null)) as unknown as ApiRes<{
    status?: ProductStatus;
    updatedAt?: string;
  }>;
  if (!isApiOk<{ status?: ProductStatus; updatedAt?: string }>(raw))
    throw new Error("Réponse invalide");
  return raw.data;
}

/** GET /products/:id — pour l’édition & l’aperçu (normalise id/_id) */
export async function getProduct(id: string): Promise<ProductFull> {
  const headers = authHeaders();
  const res = await fetch(`${API_BASE}/marketplace/products/${id}`, {
    headers,
  });
  if (!res.ok) throw new Error("Chargement du produit impossible");

  const raw = (await res.json().catch(() => null)) as unknown as ApiRes<{
    product: unknown;
  }>;
  const payload = isApiOk<{ product: unknown }>(raw)
    ? raw.data
    : { product: id };
  const rawUnknown = payload.product;

  const normalized =
    rawUnknown && isObject(rawUnknown)
      ? (rawUnknown as Partial<ProductFull> & { _id?: string; id?: string })
      : ({ id } as Partial<ProductFull> & { _id?: string; id?: string });

  const normalizedId =
    (normalized.id && String(normalized.id)) ||
    (normalized._id && String(normalized._id)) ||
    id;

  const product: ProductFull = {
    ...(normalized as ProductFull),
    id: normalizedId,
  };

  if (!product.images || product.images.length === 0) {
    product.images = product.imageUrl ? [product.imageUrl] : [];
  }
  return product;
}

/* ---------- Avis produit ---------- */

export async function getProductReviews(id: string): Promise<ReviewsPayload> {
  const headers = authHeaders();
  const res = await fetch(`${API_BASE}/marketplace/products/${id}/reviews`, {
    headers,
  });
  if (!res.ok) throw new Error("Chargement des avis impossible");

  const raw = (await res
    .json()
    .catch(() => null)) as unknown as ApiRes<ReviewsPayload>;
  const data = isApiOk<ReviewsPayload>(raw) ? raw.data : undefined;

  return (
    data ?? {
      average: 0,
      count: 0,
      reviews: [],
      myReview: null,
      isOwner: false,
    }
  );
}

export async function postProductReview(
  id: string,
  payload: { rating: number; comment: string }
) {
  const headers = authHeaders();
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE}/marketplace/products/${id}/reviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Impossible d’enregistrer l’avis");
  }
  const raw = (await res
    .json()
    .catch(() => null)) as unknown as ApiRes<ReviewsPayload>;
  if (!isApiOk<ReviewsPayload>(raw)) throw new Error("Réponse invalide");
  return raw.data;
}

/** DELETE /products/:id — soft delete */
export async function deleteProduct(id: string): Promise<boolean> {
  const headers = authHeaders();
  const res = await fetch(`${API_BASE}/marketplace/products/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Suppression impossible");
  return true;
}
