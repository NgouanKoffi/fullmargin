// src/pages/communaute/private/community-details/api/reviews.api.ts
import { api, ApiError } from "../../../../../lib/api";

/* ================== Types backend ================== */
export type ReviewBE = {
  id: string;
  user: { id: string; fullName?: string; avatarUrl?: string } | string;
  communityId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  message?: string;
  comment?: string;
  body?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

export type ReviewsListResponse = {
  items?: ReviewBE[];
  data?: { items?: ReviewBE[]; page?: number; limit?: number; total?: number };
  results?: ReviewBE[];
  page?: number;
  limit?: number;
  total?: number;
};

/* ================== Helpers ================== */
async function tryGET<T>(
  paths: string[],
  query?: Record<string, unknown>
): Promise<T> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      return await api.get<T>(p, query);
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status === 404) continue;
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Not found");
}

async function tryPOST<T>(paths: string[], json?: unknown): Promise<T> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      return await api.post<T>(p, json);
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status === 404) continue;
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Not found");
}

async function tryDELETE<T>(paths: string[]): Promise<T> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      return await api.delete<T>(p);
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status === 404) continue;
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Not found");
}

/* ================== API ================== */
// Liste publique des avis d’une communauté
export async function listCommunityReviews(
  communityId: string,
  page = 1,
  limit = 10
): Promise<ReviewsListResponse> {
  // backend: GET /communaute/reviews/:communityId?page=&limit=
  const res = await tryGET<{
    ok: boolean;
    data?: {
      items?: ReviewBE[];
      page?: number;
      limit?: number;
      total?: number;
    };
  }>([`/communaute/reviews/${communityId}`], { page, limit });

  const items = res?.data?.items ?? [];
  return {
    items,
    data: { items, page: res?.data?.page, limit: res?.data?.limit },
    page: res?.data?.page,
    limit: res?.data?.limit,
    total: res?.data?.total,
  };
}

// Créer / mettre à jour MON avis (un seul par user)
export async function upsertMyReview(
  communityId: string,
  payload: { rating: 1 | 2 | 3 | 4 | 5; message?: string }
): Promise<{ id: string; mode: "created" | "updated" }> {
  // backend: POST /communaute/reviews/upsert
  const body = {
    communityId,
    rating: payload.rating,
    comment: payload.message,
  };
  const r = await tryPOST<{
    ok: boolean;
    data?: { id: string; mode: "created" | "updated" };
  }>([`/communaute/reviews/upsert`], body);
  if (!r?.data?.id) throw new Error("Upsert review: réponse invalide");
  return r.data;
}

// Supprimer MON avis par ID
export async function deleteMyReview(reviewId: string) {
  return await tryDELETE<void>([`/communaute/reviews/${reviewId}`]);
}

/* ====== 🔔 nouveaux pour les notifs d’avis ====== */

// Combien d’avis non lus pour MOI (owner)
export async function getReviewCountersMe(): Promise<{ unseen: number }> {
  try {
    const r = await api.get<{ ok: boolean; data?: { unseen?: number } }>(
      "/communaute/reviews/counters/me"
    );
    return { unseen: r.data?.unseen ?? 0 };
  } catch {
    return { unseen: 0 };
  }
}

// Marquer comme vus (on peut appeler sans payload)
export async function markReviewsSeen(reviewIds?: string[]) {
  try {
    await api.post("/communaute/reviews/mark-seen", {
      reviewIds: Array.isArray(reviewIds) ? reviewIds : [],
    });
  } catch {
    // pas bloquant
  }
}
