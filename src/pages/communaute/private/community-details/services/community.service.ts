// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\services\community.service.ts
import { loadSession } from "../../../../../auth/lib/storage";

import { API_BASE as RAW_BASE } from "../../../../../lib/api";
import type { CommunityCreateFiles, CommunityCreatePayload } from "../types";

/* =========================================================
   Auth + BASE normalisé
   ========================================================= */
function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// retire les / finaux pour éviter // en prod (CDN / reverse-proxy)
const API_BASE = RAW_BASE.replace(/\/+$/, "");

/* =========================================================
   Types
   ========================================================= */
export type CommunityMinimal = {
  id: string;
  slug: string;
  name?: string;
  visibility?: "public" | "private";
  category?: string;
  categoryOther?: string;
  description?: string;
  coverUrl?: string;
  logoUrl?: string;
};

type ApiEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type MyCommunitiesResponse = ApiEnvelope<{
  items?: Array<Record<string, unknown>>;
}>;

type SlugCheckResponse = ApiEnvelope<{ available?: boolean }>;
type NameCheckResponse = ApiEnvelope<{ available?: boolean }>;
type CreateUpdateResponse = ApiEnvelope<CommunityMinimal>;

/* ======= Types Achats (courses/payments) ======= */
export type CourseOrderListItem = {
  id: string;
  status: string;
  paidAt?: string | null;
  createdAt?: string | null;
  course: {
    id: string;
    title: string;
    coverUrl: string;
    communityId: string | null;
  };
  amounts: {
    currency: string;
    amount?: number | null;
    amountCents?: number | null;
  };
  receiptUrl?: string | null;
};

type OrdersListResponse = ApiEnvelope<{
  items: CourseOrderListItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}>;

/* ---------- Stripe payload typé (au lieu de any) ---------- */
type StripeAmounts = {
  currency?: string;
  amount?: number | null;
  fee?: number | null;
  net?: number | null;
  amountCents?: number | null;
  feeCents?: number | null;
  netCents?: number | null;
} | null;

type StripePaymentMethod = {
  type?: string | null;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
} | null;

type StripeInfo = {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  chargeId?: string | null;
  receiptUrl?: string | null;
  customerEmail?: string | null;
  amounts?: StripeAmounts;
  paymentMethod?: StripePaymentMethod;
} | null;

type RefreshResponse = ApiEnvelope<{
  order: {
    id: string;
    status: string;
    paidAt: string | null;
    course: string;
    courseTitle?: string | null;
    stripe?: StripeInfo;
  };
}>;

/* =========================================================
   Utils génériques
   ========================================================= */
async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as unknown as T;
  } catch {
    return null;
  }
}

/** Ajoute un cache-buster _t */
function withCacheBuster(url: string): string {
  const u = new URL(url, window.location.origin);
  u.searchParams.set("_t", String(Date.now()));
  return u.toString();
}

/** Tolérance d’orthographe d’endpoint : communaute ↔ communautes */
function pathVariants(p: string): string[] {
  const a = p.replace("/communautes/", "/communaute/");
  const b = p.replace("/communaute/", "/communautes/");
  return Array.from(new Set([p, a, b]));
}

/**
 * Fait la requête sur chaque variante jusqu’à tomber
 * sur un status != 404 (ou épuisement).
 */
async function fetchWithFallback(
  paths: string[],
  init: RequestInit = {}
): Promise<Response> {
  let lastError: unknown = null;

  for (const p of paths) {
    const url = withCacheBuster(`${API_BASE}${p}`);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        mode: "cors",
        ...init,
        headers: {
          ...(init.headers || {}),
        },
      });
      if (res.status !== 404) return res;
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError) {
    return new Response("Network error", { status: 599 });
  }
  return new Response("Not Found", { status: 404 });
}

/** Mappe proprement un item brut vers CommunityMinimal */
function mapCommunity(
  first?: Record<string, unknown>
): CommunityMinimal | null {
  if (!first) return null;
  const id =
    String(
      (first as { id?: unknown })?.id ?? (first as { _id?: unknown })?._id ?? ""
    ) || "";
  if (!id) return null;

  const visibilityRaw = String(
    (first as { visibility?: unknown })?.visibility ?? ""
  );
  return {
    id,
    slug: String((first as { slug?: unknown })?.slug ?? ""),
    name: String((first as { name?: unknown })?.name ?? ""),
    visibility: visibilityRaw === "private" ? "private" : "public",
    category: String(
      (first as { category?: unknown })?.category ?? "price_action"
    ),
    categoryOther: String(
      (first as { categoryOther?: unknown })?.categoryOther ?? ""
    ),
    description: String(
      (first as { description?: unknown })?.description ?? ""
    ),
    coverUrl: String((first as { coverUrl?: unknown })?.coverUrl ?? ""),
    logoUrl: String((first as { logoUrl?: unknown })?.logoUrl ?? ""),
  };
}

/* =========================================================
   API: ma communauté (prend la plus récente si plusieurs)
   ========================================================= */
export async function fetchMyCommunity(): Promise<CommunityMinimal | null> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/communities/my`),
    {
      method: "GET",
      headers: { ...authHeaders() },
    }
  );

  if (!res.ok) return null;
  const json = await parseJson<MyCommunitiesResponse>(res);
  const first = json?.data?.items?.[0] as Record<string, unknown> | undefined;
  return mapCommunity(first);
}

/* =========================================================
   API: check slug
   ========================================================= */
export async function checkSlugAvailable(
  slug: string
): Promise<boolean | null> {
  const s = slug.trim().toLowerCase();
  if (!s) return null;

  const res = await fetchWithFallback(
    pathVariants(`/communaute/communities/slug/${encodeURIComponent(s)}/check`),
    { method: "GET" }
  );
  if (!res.ok) return null;

  const json = await parseJson<SlugCheckResponse>(res);
  return Boolean(json?.data?.available);
}

/* =========================================================
   API: check nom (unicité)
   ========================================================= */
export async function checkNameAvailable(
  name: string
): Promise<boolean | null> {
  const v = name.trim();
  if (v.length < 3) return null;

  const res = await fetchWithFallback(
    pathVariants(
      `/communaute/communities/name/check?name=${encodeURIComponent(v)}`
    ),
    { method: "GET" }
  );
  if (!res.ok) return null;

  const json = await parseJson<NameCheckResponse>(res);
  return Boolean(json?.data?.available);
}

/* =========================================================
   Normalisation payload → FormData (créa / maj)
   ========================================================= */
function buildFD(
  payload: CommunityCreatePayload,
  files: CommunityCreateFiles
): FormData {
  const fd = new FormData();
  const safeSlug = payload.slug.trim().toLowerCase();

  fd.append("name", payload.name.trim());
  fd.append("slug", safeSlug);
  fd.append("visibility", payload.visibility);
  fd.append("category", payload.category);
  if (payload.category === "autre" && payload.categoryOther) {
    fd.append("categoryOther", payload.categoryOther);
  }
  fd.append("description", payload.description ?? "");

  if (files.cover) fd.append("cover", files.cover);
  if (files.logo) fd.append("logo", files.logo);

  return fd;
}

/* =========================================================
   API: création
   ========================================================= */
export async function createCommunity(
  payload: CommunityCreatePayload,
  files: CommunityCreateFiles
): Promise<CommunityMinimal> {
  const fd = buildFD(payload, files);

  const res = await fetchWithFallback(pathVariants(`/communaute/communities`), {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });

  if (res.status === 409) {
    const body = await res.text().catch(() => "");
    const code = body.includes("NAME_TAKEN")
      ? "NAME_TAKEN"
      : body.includes("SLUG_TAKEN")
      ? "SLUG_TAKEN"
      : "CONFLICT";
    throw new Error(code);
  }
  if (res.status === 599) throw new Error("NETWORK_ERROR");
  if (!res.ok)
    throw new Error((await res.text().catch(() => "")) || "CREATE_FAILED");

  const json = await parseJson<CreateUpdateResponse>(res);
  if (!json?.data) throw new Error("CREATE_FAILED");
  return json.data;
}

/* =========================================================
   API: mise à jour
   ========================================================= */
export async function updateCommunity(
  id: string,
  payload: CommunityCreatePayload,
  files: CommunityCreateFiles
): Promise<CommunityMinimal> {
  const fd = buildFD(payload, files);
  const safeId = encodeURIComponent(String(id).trim());

  const res = await fetchWithFallback(
    pathVariants(`/communaute/communities/${safeId}`),
    {
      method: "PUT",
      headers: { ...authHeaders() },
      body: fd,
    }
  );

  if (res.status === 409) {
    const body = await res.text().catch(() => "");
    const code = body.includes("NAME_TAKEN")
      ? "NAME_TAKEN"
      : body.includes("SLUG_TAKEN")
      ? "SLUG_TAKEN"
      : "CONFLICT";
    throw new Error(code);
  }
  if (res.status === 599) throw new Error("NETWORK_ERROR");
  if (!res.ok)
    throw new Error((await res.text().catch(() => "")) || "UPDATE_FAILED");

  const json = await parseJson<CreateUpdateResponse>(res);
  if (!json?.data) throw new Error("UPDATE_FAILED");
  return json.data;
}

/* =========================================================
   ===  NOUVEAU : APIs Achats  =============================
   ========================================================= */

/** Forcer l’hydratation d’une commande au retour Stripe */
export async function refreshCourseOrder(args: {
  orderId?: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
}): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE}/courses/payments/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      orderId: args.orderId || undefined,
      sessionId: args.sessionId || undefined,
      paymentIntentId: args.paymentIntentId || undefined,
    }),
  });
  const json = (await parseJson<RefreshResponse>(res)) || { ok: false };
  return json;
}

/** Lister mes achats (paginé) */
export async function listMyCourseOrders(
  page = 1,
  limit = 20
): Promise<OrdersListResponse> {
  const res = await fetch(
    `${API_BASE}/courses/payments/mine?page=${page}&limit=${limit}`,
    { headers: { ...authHeaders() } }
  );
  const json = (await parseJson<OrdersListResponse>(res)) || {
    ok: false,
    data: { items: [], page, limit, total: 0, hasMore: false },
  };
  return json;
}

/* ========================== VENTES (payouts vendeur) ========================== */

export type SellerPayoutItem = {
  id: string;
  status: "available" | "pending" | "paid";
  currency: string;
  commissionRate: number;
  createdAt: string | null;
  orderId: string | null;
  amounts: {
    unit: number | null;
    gross: number | null;
    commission: number | null;
    net: number | null;
    unitCents: number | null;
    grossCents: number | null;
    commissionCents: number | null;
    netCents: number | null;
  };
  course: {
    id: string;
    title: string;
    coverUrl: string;
    communityId: string | null;
  } | null;
  buyer: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  } | null;
};

export type SellerPayoutListResponse = ApiEnvelope<{
  items: SellerPayoutItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}>;

export type SellerSummaryItem = {
  currency: string;
  available: number;
  pending: number;
  paidLifetime: number;
  grossLifetime: number;
  commissionLifetime: number;
  count: number;
};

export type SellerSummaryResponse = ApiEnvelope<{
  summary: SellerSummaryItem[];
}>;

export async function listMySellerPayouts(params?: {
  page?: number;
  limit?: number;
  status?: "available" | "pending" | "paid";
  currency?: string;
  q?: string;
}): Promise<SellerPayoutListResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("limit", String(limit));
  if (params?.status) sp.set("status", params.status);
  if (params?.currency) sp.set("currency", params.currency.toLowerCase());
  if (params?.q) sp.set("q", params.q);

  const res = await fetch(`${API_BASE}/courses/payouts/mine?${sp.toString()}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  const json =
    (await parseJson<SellerPayoutListResponse>(res)) ||
    ({} as SellerPayoutListResponse);
  return json;
}

export async function getMySellerSummary(): Promise<SellerSummaryResponse> {
  const res = await fetch(`${API_BASE}/courses/payouts/mine/summary`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  const json =
    (await parseJson<SellerSummaryResponse>(res)) ||
    ({ ok: false, data: { summary: [] } } as SellerSummaryResponse);
  return json;
}
