// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\api\complaints.api.ts
import { api, ApiError, type QueryRecord } from "../../../../../lib/api";

/* ================== Types backend ================== */
export type ComplaintReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "counterfeit"
  | "other";

export type ComplaintBE = {
  id: string;
  communityId?: string;
  userId?: string;
  reason: ComplaintReason | string;
  message?: string;
  details?: string;
  body?: string;
  images?: string[];
  subject?: { type: "post" | "comment" | "user" | "other"; id?: string } | null;
  status?: "open" | "in_review" | "resolved" | "rejected" | "pending";
  createdAt: string | Date;
  updatedAt?: string | Date;
};

export type ComplaintsListResponse = {
  items?: ComplaintBE[];
  data?: { items?: ComplaintBE[] };
  results?: ComplaintBE[];
};

export type ComplaintCreateDTO = {
  communityId: string;
  reason: ComplaintReason | string;
  message?: string;
  images?: string[];
  subject?: { type: "post" | "comment" | "user" | "other"; id?: string };
};

/* ================== Helpers ================== */
async function tryGET<T>(paths: string[], query?: QueryRecord): Promise<T> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      // ✅ on passe un init avec { query }, pas la query brute
      return await api.get<T>(p, { query });
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

/* ================== API ================== */
// Liste des plaintes “contextuelle” : owner → incoming/:id ; sinon → my puis filtre
export async function listCommunityComplaints(
  communityId: string,
  page = 1,
  limit = 50
) {
  const query: QueryRecord = { page, limit };

  // 1) tentative owner
  try {
    const resOwner = await tryGET<ComplaintsListResponse>(
      [`/communaute/complaints/incoming/${communityId}`],
      query
    );
    const items =
      resOwner.items ?? resOwner.data?.items ?? resOwner.results ?? [];
    return { items };
  } catch {
    // 2) fallback: mes plaintes puis filtre côté client
    const resMine = await tryGET<ComplaintsListResponse>(
      [`/communaute/complaints/my`],
      query
    );
    const mine = resMine.items ?? resMine.data?.items ?? resMine.results ?? [];

    type MineItem = ComplaintBE & {
      community?: { id?: string } | null;
    };

    const mineTyped = mine as MineItem[];
    const items = mineTyped.filter(
      (r) => (r.community?.id ?? r.communityId) === communityId
    );
    return { items };
  }
}

// Créer une plainte
export async function createComplaint(
  dto: ComplaintCreateDTO
): Promise<ComplaintBE> {
  const body = {
    communityId: dto.communityId,
    message: dto.message,
    details: dto.message,
    body: dto.message,
    images: dto.images,
    subject: dto.subject,
  };
  const res = await tryPOST<{ ok: boolean; data?: { id: string } }>(
    [`/communaute/complaints`],
    body
  );
  if (!res?.data?.id) throw new Error("Création plainte: réponse invalide");
  const now = new Date().toISOString();
  return {
    id: res.data.id,
    communityId: dto.communityId,
    reason: dto.reason,
    message: dto.message,
    images: dto.images,
    subject: dto.subject,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

/* =========================================================================
   Stubs d’édition/suppression (le BE public actuel ne les expose pas)
   → on fournit des fonctions pour satisfaire les hooks, sans erreur ESLint.
   ========================================================================= */

// PATCH/PUT d’une plainte (non supporté côté BE public)
export async function updateComplaint(
  id: string,
  patch: Partial<ComplaintBE>
): Promise<ComplaintBE | null> {
  // on “utilise” les args pour éviter no-unused-vars
  if (!id) return null;
  // on pourrait tenter une route privée ici si dispo
  void Object.keys(patch || {}); // évite l’avertissement
  return null;
}

// DELETE d’une plainte (non supporté côté BE public)
export async function removeComplaint(id: string): Promise<boolean> {
  if (!id) return false;
  // pas d’endpoint → on “réussit” côté client
  return false;
}

// Compat éventuelle (si certains imports attendent deleteComplaint)
export const deleteComplaint = removeComplaint;
