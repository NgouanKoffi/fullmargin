import { loadSession } from "../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../lib/api";

// src/pages/communaute/public/components/feed/api/posts.api.ts
export type ApiPostItem = {
  id: string;
  communityId: string;
  author: { id: string; fullName: string; avatarUrl?: string };
  content: string;
  media: { type: "image" | "video"; url: string; thumbnail?: string }[];
  likes: number;
  comments: number;
  createdAt: string;
};

type ListResp = {
  ok: boolean;
  data: {
    items: ApiPostItem[];
    hasMore: boolean;
    page: number;
    limit?: number;
    total?: number;
  };
};
type OkResp = { ok: boolean };
type CreateResp = { ok: boolean; data: ApiPostItem };
type ErrResp = { ok?: false; error?: string };

const BASE = `${API_BASE.replace(/\/+$/, "")}/communaute/posts`;

/** Auth header via token stocké (évite credentials: "include" et soucis CORS). */
function authHeaders(): Record<string, string> {
  const token = (loadSession() as { token?: string } | null)?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function asErrorMessage(r: Response, fallback: string) {
  return r
    .json()
    .catch(() => null)
    .then((j: ErrResp | null) => j?.error || `${fallback} (HTTP ${r.status})`);
}

/* ----------------------------- LIST ----------------------------- */
export async function listPosts(communityId: string, page = 1, limit = 8) {
  const url = new URL(BASE);
  url.searchParams.set("communityId", communityId);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("_t", Date.now().toString()); // anti-cache CDN

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: { ...authHeaders() },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(await asErrorMessage(r, "Impossible de charger les posts"));
  }
  return (await r.json()) as ListResp;
}

/* ---------------------------- CREATE ---------------------------- */
export async function createPost(
  communityId: string,
  text: string,
  files: File[]
) {
  const fd = new FormData();
  fd.set("communityId", communityId);
  fd.set("content", text);
  for (const f of files) fd.append("media", f);

  const r = await fetch(BASE, {
    method: "POST",
    // ❌ ne PAS mettre Content-Type (laisse le browser le gérer pour multipart)
    headers: { ...authHeaders() },
    body: fd,
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(await asErrorMessage(r, "Création du post échouée"));
  }
  return (await r.json()) as CreateResp;
}

/* ---------------------------- UPDATE ---------------------------- */
export async function updatePost(id: string, text: string) {
  const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ content: text }),
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(await asErrorMessage(r, "Mise à jour échouée"));
  }
  return (await r.json()) as OkResp;
}

/* ---------------------------- DELETE ---------------------------- */
export async function deletePost(id: string) {
  const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(await asErrorMessage(r, "Suppression échouée"));
  }
  return (await r.json()) as OkResp;
}
