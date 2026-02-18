// src/pages/admin/marketplace/api/client.ts
import { loadSession } from "../../../../auth/lib/storage";
import type {
  AdminCategory,
  AdminProductItem,
  AdminShopItem,
  ApiResult,
  ListCategoriesRes,
  CreateCategoryBody,
  CreateCategoryRes,
  UpdateCategoryRes,
  DeleteCategoryRes,
  ListShopsRes,
  SetShopStatusRes,
  ProductQuery,
  ListProductsRes,
  PatchProductBody,
  PatchProductRes,
  BadgeToggleRes,
  DeleteProductRes,
  GetAdminProductRes,
  RestoreProductRes,
  // 🔥 promos
  AdminPromo,
  CreatePromoBody,
  ListPromosRes,
  CreatePromoRes,
  PatchPromoRes,
  DeletePromoRes,
  // ✅ commissions
  AdminCommissionQuery,
  ListAdminCommissionsRes,
  AdminCommissionDetail,
} from "./types";

/* ========= API base & helpers ========= */
const API_BASE: string = (import.meta.env?.VITE_API_BASE ?? "/api").toString();

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
function buildApiUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const trimmed = path.replace(/^\/+/, "");
  const withoutApi = trimmed.startsWith("api/") ? trimmed.slice(4) : trimmed;
  return joinUrl(API_BASE, withoutApi);
}

/** ✅ URL proxy fichier pour le modal admin */
export function adminProductFileUrl(
  id: string,
  name?: string,
  disposition: "inline" | "attachment" = "inline"
): string {
  const base = buildApiUrl(
    `admin/marketplace/products/${encodeURIComponent(id)}/file`
  );
  const qs = new URLSearchParams();
  if (name) qs.set("name", name.replace(/\s+/g, "_"));
  if (disposition) qs.set("disposition", disposition);
  const token = loadSession()?.token;
  if (token) qs.set("token", token);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

/** Convertit une valeur (url/chemin) en URL utilisable pour <img>/<iframe> */
export function resolveMediaUrl(u?: string | null): string | undefined {
  const s = (u ?? "").trim();
  if (!s) return undefined;
  if (s.startsWith("blob:") || s.startsWith("data:") || isAbsoluteUrl(s)) {
    return s;
  }
  return buildApiUrl(s);
}

async function authFetchJSON<T>(
  url: string,
  init?: RequestInit & { expectJSON?: boolean }
): Promise<T> {
  const token = loadSession()?.token || null;
  const finalUrl = buildApiUrl(url);
  const res = await fetch(finalUrl, {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    body: init?.body,
  });

  if (res.status === 401 || res.status === 403) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || (res.status === 401 ? "unauthorized" : "forbidden"));
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || res.statusText);
  }

  const mustBeJSON = init?.expectJSON !== false;
  if (!mustBeJSON) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  if (!/json/i.test(ct)) {
    const peek = await res.text().catch(() => "");
    throw new Error(
      `Réponse non-JSON (content-type="${ct}")${
        peek ? ` — aperçu: ${peek.slice(0, 180)}` : ""
      }`
    );
  }
  return (await res.json()) as T;
}

/* ========= Categories ========= */
export async function listCategories(): Promise<ListCategoriesRes> {
  try {
    return await authFetchJSON<ListCategoriesRes>(
      "admin/marketplace/categories"
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg };
  }
}

export async function createCategory(
  payload: CreateCategoryBody
): Promise<CreateCategoryRes> {
  try {
    return await authFetchJSON<CreateCategoryRes>(
      "admin/marketplace/categories",
      { method: "POST", body: JSON.stringify(payload) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as CreateCategoryRes;
  }
}

export async function updateCategory(
  id: string,
  patch: Partial<
    Pick<AdminCategory, "key" | "label" | "commissionPct" | "featured">
  >
): Promise<UpdateCategoryRes> {
  try {
    return await authFetchJSON<UpdateCategoryRes>(
      `admin/marketplace/categories/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as UpdateCategoryRes;
  }
}

export async function deleteCategory(id: string): Promise<DeleteCategoryRes> {
  try {
    return await authFetchJSON<DeleteCategoryRes>(
      `admin/marketplace/categories/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as DeleteCategoryRes;
  }
}

/* ========= Shops ========= */
export async function listShops(q: string): Promise<ListShopsRes> {
  try {
    const qp = q ? `?q=${encodeURIComponent(q)}` : "";
    return await authFetchJSON<ListShopsRes>(`admin/marketplace/shops${qp}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg };
  }
}

export async function setShopStatus(
  id: string,
  action: "activate" | "suspend"
): Promise<SetShopStatusRes> {
  try {
    return await authFetchJSON<SetShopStatusRes>(
      `admin/marketplace/shops/${encodeURIComponent(id)}/status`,
      { method: "POST", body: JSON.stringify({ action }) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as SetShopStatusRes;
  }
}

/* ========= Products ========= */
function buildProductQuery(params: ProductQuery): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.shopId) qs.set("shopId", params.shopId);
  if (params.categoryKey) qs.set("categoryKey", params.categoryKey);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listProducts(
  params: ProductQuery
): Promise<ListProductsRes> {
  try {
    const q = buildProductQuery(params);
    return await authFetchJSON<ListProductsRes>(
      `admin/marketplace/products${q}`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg };
  }
}

export async function getAdminProduct(id: string): Promise<GetAdminProductRes> {
  try {
    return await authFetchJSON<GetAdminProductRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as GetAdminProductRes;
  }
}

/** PATCH générique produit */
export async function patchProduct(
  id: string,
  patch: PatchProductBody
): Promise<PatchProductRes> {
  try {
    return await authFetchJSON<PatchProductRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as PatchProductRes;
  }
}

/* ========= Badge / Feature / Suppression / Restauration ========= */
export async function toggleBadge(id: string): Promise<BadgeToggleRes> {
  try {
    return await authFetchJSON<BadgeToggleRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}/badge`,
      { method: "PATCH" }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as BadgeToggleRes;
  }
}

export type FeatureToggleRes = ApiResult<{
  id: string;
  featured: boolean;
  message: string;
}>;
export async function featureProduct(
  id: string,
  featured?: boolean
): Promise<FeatureToggleRes> {
  try {
    const body =
      featured === undefined ? undefined : JSON.stringify({ featured });
    return await authFetchJSON<FeatureToggleRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}/feature`,
      { method: "PATCH", ...(body ? { body } : {}) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as FeatureToggleRes;
  }
}

export async function deleteProduct(id: string): Promise<DeleteProductRes> {
  try {
    return await authFetchJSON<DeleteProductRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as DeleteProductRes;
  }
}

export async function restoreProduct(id: string): Promise<RestoreProductRes> {
  try {
    return await authFetchJSON<RestoreProductRes>(
      `admin/marketplace/products/${encodeURIComponent(id)}/restore`,
      { method: "PATCH" }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as RestoreProductRes;
  }
}

/* ========= Promos ========= */
export async function listPromos(): Promise<ListPromosRes> {
  try {
    return await authFetchJSON<ListPromosRes>("admin/marketplace/promo-codes");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg };
  }
}

export async function createPromo(
  payload: CreatePromoBody
): Promise<CreatePromoRes> {
  try {
    return await authFetchJSON<CreatePromoRes>(
      "admin/marketplace/promo-codes",
      { method: "POST", body: JSON.stringify(payload) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as CreatePromoRes;
  }
}

export async function patchPromo(
  id: string,
  patch: Partial<CreatePromoBody>
): Promise<PatchPromoRes> {
  try {
    return await authFetchJSON<PatchPromoRes>(
      `admin/marketplace/promo-codes/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as PatchPromoRes;
  }
}

export async function deletePromo(id: string): Promise<DeletePromoRes> {
  try {
    return await authFetchJSON<DeletePromoRes>(
      `admin/marketplace/promo-codes/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as DeletePromoRes;
  }
}

/* ========= Commissions admin ========= */

function buildCommissionQuery(params: AdminCommissionQuery): string {
  const qs = new URLSearchParams();
  if (params.page != null) qs.set("page", String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.seller) qs.set("seller", params.seller);
  if (params.buyer) qs.set("buyer", params.buyer);
  if (params.product) qs.set("product", params.product);
  if (params.order) qs.set("order", params.order);
  if (params.currency) qs.set("currency", params.currency);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.q) qs.set("q", params.q);
  if (params.sort) qs.set("sort", params.sort);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Liste paginée des commissions admin */
export async function listAdminCommissions(
  params: AdminCommissionQuery
): Promise<ListAdminCommissionsRes> {
  try {
    const q = buildCommissionQuery(params);
    return await authFetchJSON<ListAdminCommissionsRes>(
      `admin/marketplace/commissions${q}`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg };
  }
}

/** Détail d’une commission (avec méta commande/payout si dispo) */
export async function getAdminCommissionDetail(
  id: string
): Promise<ApiResult<AdminCommissionDetail>> {
  try {
    return await authFetchJSON<ApiResult<AdminCommissionDetail>>(
      `admin/marketplace/commissions/${encodeURIComponent(id)}`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, error: msg } as ApiResult<AdminCommissionDetail>;
  }
}

/* ========= Format monétaire ========= */
export const moneyFmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(
    Math.max(0, Number.isFinite(n) ? n : 0)
  );

/* ========= Ré-exports ========= */
export type {
  AdminCategory,
  AdminProductItem,
  AdminShopItem,
  ProductQuery,
  ApiResult,
  ListCategoriesRes,
  CreateCategoryBody,
  CreateCategoryRes,
  UpdateCategoryRes,
  DeleteCategoryRes,
  ListShopsRes,
  SetShopStatusRes,
  ListProductsRes,
  PatchProductBody,
  PatchProductRes,
  BadgeToggleRes,
  DeleteProductRes,
  GetAdminProductRes,
  RestoreProductRes,
  // promos
  AdminPromo,
  CreatePromoBody,
  ListPromosRes,
  CreatePromoRes,
  PatchPromoRes,
  DeletePromoRes,
  // commissions
  AdminCommissionQuery,
  ListAdminCommissionsRes,
  AdminCommissionDetail,
};
