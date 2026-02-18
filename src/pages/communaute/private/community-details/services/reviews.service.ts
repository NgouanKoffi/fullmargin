// src/pages/communaute/private/community-details/tabs/CommunityProfil/services/reviews.service.ts
import { API_BASE as RAW_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = RAW_BASE.replace(/\/+$/, "");

function withCacheBuster(url: string): string {
  const u = new URL(url, window.location.origin);
  u.searchParams.set("_t", String(Date.now()));
  return u.toString();
}

function pathVariants(p: string): string[] {
  const a = p.replace("/communautes/", "/communaute/");
  const b = p.replace("/communaute/", "/communautes/");
  return Array.from(new Set([p, a, b]));
}

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
      // si ce n'est pas 404 → on prend
      if (res.status !== 404) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) return new Response("Network error", { status: 599 });
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

/**
 * Récupère le nombre d’avis non lus pour le propriétaire de la communauté
 */
export async function getReviewCounters(): Promise<{ unseen: number }> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/reviews/counters/me`)
  );
  if (!res.ok) return { unseen: 0 };
  const j = await parseJson<ApiEnv<{ unseen: number }>>(res);
  return { unseen: j?.data?.unseen ?? 0 };
}

/**
 * Marque les avis comme vus.
 * Si tu ne passes pas d’IDs, le backend doit “tout” marquer.
 * Ensuite on émet un event pour que le reste du front rafraîchisse le badge.
 */
export async function markReviewNotificationsAsSeen(
  reviewIds?: string[]
): Promise<void> {
  const res = await fetchWithFallback(
    pathVariants(`/communaute/reviews/mark-seen`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Array.isArray(reviewIds) ? { reviewIds } : { reviewIds: [] }
      ),
    }
  );

  if (!res.ok) {
    console.warn("[reviews.service] mark-seen failed");
    return;
  }

  // 🔔 prévenir le front qu’il faut recharger les compteurs d’avis
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("fm:community-review-counters:force-refresh")
    );
  }
}
