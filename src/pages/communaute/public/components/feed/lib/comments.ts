/* Client typed pour les commentaires — complet */
// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\lib\comments.ts
import { loadSession } from "../../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../../lib/api";
import type { CommentLite } from "../types";

/* ==== Types API génériques ==== */
type ApiResp<T> = { ok: true; data: T } | { ok: false; error: string };

type ApiList<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/* ==== Normalisation STRICTE côté front
   On prend exactement ce que renvoie le backend :
   - author: { id, name, avatarUrl, isVerified }
   - champs plats compatibles (authorName, authorAvatarUrl, isVerified)
   On renvoie { author: { name, avatar } } pour coller aux composants.
==== */
function mapComment(raw: unknown): CommentLite {
  const r = (raw as Record<string, unknown>) || {};
  const aRaw = r["author"] as unknown;

  let id = "";
  let name = "Utilisateur";
  let avatar = "";
  let isVerified = false;

  if (aRaw && typeof aRaw === "object") {
    const a = aRaw as Record<string, unknown>;
    id = String(a["id"] ?? "");
    name = String(
      a["name"] ??
        a["fullName"] ?? // compat éventuelle
        r["authorName"] ??
        r["authorFullName"] ??
        "Utilisateur"
    ).trim();
    avatar = String(
      a["avatarUrl"] ??
        a["avatar"] ?? // compat éventuelle
        r["authorAvatarUrl"] ??
        ""
    ).trim();
    isVerified = Boolean(a["isVerified"] ?? r["isVerified"]);
  } else if (typeof aRaw === "string" && aRaw) {
    id = aRaw;
    name = String(
      r["authorName"] ?? r["authorFullName"] ?? "Utilisateur"
    ).trim();
    avatar = String(r["authorAvatarUrl"] ?? "").trim();
    isVerified = Boolean(r["isVerified"]);
  }

  return {
    id: String(r["_id"] ?? r["id"] ?? ""),
    text: String(r["text"] ?? ""),
    createdAt: String(r["createdAt"] ?? new Date().toISOString()),
    author: { id: id || undefined, name, avatar, isVerified },
    replies: Array.isArray(r["replies"])
      ? (r["replies"] as unknown[]).map(mapComment)
      : undefined,
  };
}

/* ==== Helpers ==== */
function authHeaders(): HeadersInit {
  const session = loadSession() as { token?: string } | null;
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (session?.token) h.Authorization = `Bearer ${session.token}`;
  return h;
}

/* ==== API ==== */

type ListArgs = {
  postId: string;
  page?: number;
  limit?: number;
  parentId?: string | null; // parentId=null => top-level; sinon réponses du parent
  /** Profondeur d'imbrication demandée côté backend (1..4). Par défaut 2. */
  nestDepth?: number;
};

/** GET liste */
export async function listComments(
  args: ListArgs
): Promise<ApiResp<ApiList<CommentLite>>> {
  const {
    postId,
    page = 1,
    limit = 100,
    parentId = null,
    nestDepth, // correspond à ton backend
  } = args;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));

  if (parentId === null) {
    // top-level -> arbre (backend : parentId= null ou absent)
    qs.set("parentId", "null");
    if (typeof nestDepth === "number") qs.set("nestDepth", String(nestDepth));
  } else if (typeof parentId === "string" && parentId) {
    // réponses d'un parent précis
    qs.set("parentId", parentId);
  }

  const res = await fetch(
    `${API_BASE}/communaute/posts/${encodeURIComponent(
      postId
    )}/comments?${qs.toString()}`,
    {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return { ok: false, error: `http_${res.status}` };
  }

  const json = (await res.json()) as ApiResp<{
    items: unknown[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }>;

  if (!json.ok) return json as { ok: false; error: string };

  const mapped: ApiList<CommentLite> = {
    items: (json.data.items || []).map(mapComment),
    page: json.data.page,
    limit: json.data.limit,
    total: json.data.total,
    hasMore: json.data.hasMore,
  };

  return { ok: true, data: mapped };
}

/** POST créer commentaire (ou réponse) */
export async function createComment(args: {
  postId: string;
  text: string;
  parentId?: string | null;
}): Promise<ApiResp<CommentLite>> {
  const { postId, text, parentId = null } = args;

  const res = await fetch(
    `${API_BASE}/communaute/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ text, parentId }),
    }
  );

  if (!res.ok) {
    return { ok: false, error: `http_${res.status}` };
  }

  const json = (await res.json()) as ApiResp<unknown>;
  if (!("ok" in json) || json.ok !== true) {
    return {
      ok: false,
      error: (json as { error?: string }).error || "api_error",
    };
  }

  return { ok: true, data: mapComment((json as { data: unknown }).data) };
}

/** PATCH éditer */
export async function editComment(args: {
  commentId: string;
  text: string;
}): Promise<ApiResp<CommentLite>> {
  const { commentId, text } = args;

  const res = await fetch(
    `${API_BASE}/communaute/comments/${encodeURIComponent(commentId)}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ text }),
    }
  );

  if (!res.ok) return { ok: false, error: `http_${res.status}` };

  const json = (await res.json()) as ApiResp<unknown>;
  if (!("ok" in json) || json.ok !== true) {
    return {
      ok: false,
      error: (json as { error?: string }).error || "api_error",
    };
  }

  return { ok: true, data: mapComment((json as { data: unknown }).data) };
}

/** DELETE supprimer */
export async function deleteComment(args: {
  commentId: string;
}): Promise<ApiResp<{ id: string }>> {
  const { commentId } = args;

  const res = await fetch(
    `${API_BASE}/communaute/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    }
  );

  if (!res.ok) return { ok: false, error: `http_${res.status}` };

  const json = (await res.json()) as ApiResp<{ id: string }>;
  return json;
}
