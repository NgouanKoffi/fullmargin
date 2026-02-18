import { API_BASE as RAW_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

/**
 * Ajoute le bearer si l'utilisateur est connecté
 */
function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = RAW_BASE.replace(/\/+$/, "");

/**
 * Empêche le cache navigateur sur nos GET sensibles
 */
function withCacheBuster(url: string): string {
  const u = new URL(url, window.location.origin);
  u.searchParams.set("_t", String(Date.now()));
  return u.toString();
}

/**
 * Certains backends exposent /communaute/... ou /communautes/...
 * On essaie les deux.
 */
function pathVariants(p: string): string[] {
  const a = p.replace("/communautes/", "/communaute/");
  const b = p.replace("/communaute/", "/communautes/");
  return Array.from(new Set([p, a, b]));
}

/**
 * Tente plusieurs chemins jusqu'à en trouver un qui ne renvoie pas 404
 */
async function fetchWithFallback(
  paths: string[],
  init: RequestInit = {}
): Promise<Response> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(withCacheBuster(`${API_BASE}${p}`), {
        cache: "no-store",
        credentials: "include",
        ...init,
        headers: {
          ...(init.headers || {}),
          "Cache-Control": "no-store",
          ...authHeaders(),
        },
      });
      // si ce n'est pas 404 → on le prend
      if (res.status !== 404) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) {
    return new Response("Network error", { status: 599 });
  }
  return new Response("Not Found", { status: 404 });
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as unknown as T;
  } catch {
    return null;
  }
}

type ApiEnv<T> = { ok?: boolean; data?: T; error?: string };

/* =====================================================
   Types
   ===================================================== */

export type MyRequestItem = {
  id: string;
  community: {
    id: string;
    name: string;
    slug: string;
    coverUrl?: string;
    logoUrl?: string;
    visibility?: "public" | "private";
  } | null;
  status: "pending" | "approved" | "rejected";
  note?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type RequestFilter = "pending" | "approved" | "rejected" | "all";

export type IncomingRequestItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  user: { id: string; fullName: string; avatarUrl?: string };
  note?: string;
  requestedAt: string;
};

export type CommunityLite = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverUrl?: string;
  ownerId?: string;
};

/**
 * Uniformise le statut venu du backend
 */
function normalizeStatus(
  raw: string | undefined | null
): "pending" | "approved" | "rejected" {
  const s = (raw || "").toLowerCase();
  if (
    s === "approved" ||
    s === "accepted" ||
    s === "acceptee" ||
    s === "acceptée"
  ) {
    return "approved";
  }
  if (
    s === "rejected" ||
    s === "refused" ||
    s === "refusee" ||
    s === "refusée"
  ) {
    return "rejected";
  }
  return "pending";
}

/* =====================================================
   MES DEMANDES
   ===================================================== */

/**
 * Demandes que MOI j'ai faites pour rejoindre des communautés
 */
export async function listMyRequests(): Promise<MyRequestItem[]> {
  const res = await fetchWithFallback(pathVariants(`/communaute/requests/my`));
  if (!res.ok) throw new Error("REQ_LIST_FAILED");
  const j = await parseJson<ApiEnv<{ items: MyRequestItem[] }>>(res);
  return (j?.data?.items || []).map((it) => ({
    ...it,
    status: normalizeStatus(it.status),
  }));
}

/* =====================================================
   DEMANDES REÇUES (owner)
   ===================================================== */

export async function listIncomingRequests(
  communityId: string,
  status: RequestFilter = "pending"
): Promise<IncomingRequestItem[]> {
  const safeId = encodeURIComponent(communityId);
  const qs =
    status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";

  const res = await fetchWithFallback(
    pathVariants(`/communaute/requests/incoming/${safeId}${qs}`)
  );
  if (!res.ok) throw new Error("REQ_INCOMING_FAILED");
  const j = await parseJson<ApiEnv<{ items: IncomingRequestItem[] }>>(res);
  return j?.data?.items || [];
}

/* =====================================================
   ACTIONS OWNER SUR UNE DEMANDE
   ===================================================== */

export async function approveRequest(requestId: string) {
  const safeId = encodeURIComponent(requestId);
  const res = await fetchWithFallback(
    pathVariants(`/communaute/requests/${safeId}/approve`),
    { method: "POST" }
  );
  if (!res.ok) throw new Error("REQ_APPROVE_FAILED");
  return true;
}

export async function rejectRequest(requestId: string, reason = "") {
  const safeId = encodeURIComponent(requestId);
  const res = await fetchWithFallback(
    pathVariants(`/communaute/requests/${safeId}/reject`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );
  if (!res.ok) throw new Error("REQ_REJECT_FAILED");
  return true;
}

/* =====================================================
   MES COMMUNAUTÉS (pour le menu, etc.)
   ===================================================== */

export async function listMyCommunities(): Promise<CommunityLite[]> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/memberships/my`)
  );
  if (!res.ok) throw new Error("MEMBERSHIPS_MY_FAILED");
  const j = await parseJson<ApiEnv<{ communityIds: string[] }>>(res);
  const ids = j?.data?.communityIds || [];
  if (ids.length === 0) return [];

  const joined = ids.map((x) => encodeURIComponent(String(x))).join(",");
  const res2 = await fetchWithFallback(
    pathVariants(`/communaute/communities/batch?ids=${joined}`)
  );
  if (!res2.ok) throw new Error("COMMUNITIES_BATCH_FAILED");
  const j2 = await parseJson<ApiEnv<{ items: CommunityLite[] }>>(res2);
  return j2?.data?.items || [];
}

/* =====================================================
   QUITTER UNE COMMUNAUTÉ
   ===================================================== */

export async function leaveCommunity(communityId: string): Promise<void> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/memberships/leave`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId }),
    }
  );
  if (!res.ok) throw new Error("MEMBERSHIP_LEAVE_FAILED");

  // 🔔 informer TOUT le front qu’on vient de quitter cette communauté
  try {
    window.dispatchEvent(
      new CustomEvent("fm:community:membership-changed", {
        detail: { communityId },
      })
    );
  } catch {
    // on ignore si window pas dispo
  }
}

/* =====================================================
   COMPTEURS DEMANDES
   ===================================================== */

export async function getRequestCounters(): Promise<{
  myPending: number;
  ownerPending: number;
}> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/requests/counters`)
  );
  if (!res.ok) {
    return { myPending: 0, ownerPending: 0 };
  }
  const j = await parseJson<
    ApiEnv<{ myPending: number; ownerPending: number }>
  >(res);
  return {
    myPending: j?.data?.myPending ?? 0,
    ownerPending: j?.data?.ownerPending ?? 0,
  };
}

/* =====================================================
   MARQUER DEMANDES COMME VUES
   ===================================================== */

export async function markMyRequestNotificationsAsSeen(
  requestIds?: string[]
): Promise<void> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/requests/mark-seen`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Array.isArray(requestIds) ? { requestIds } : { requestIds: [] }
      ),
    }
  );
  if (!res.ok) {
    console.warn("[requests.service] mark-seen failed");
  }
}
