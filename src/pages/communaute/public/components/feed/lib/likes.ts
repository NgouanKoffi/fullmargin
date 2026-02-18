// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\lib\likes.ts
import { API_BASE } from "../../../../../../lib/api";
import { loadSession } from "../../../../../../auth/lib/storage";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function toBoolOrUndef(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/** Appelle l’API pour liker (POST) ou disliker (DELETE) un post. */
export async function togglePostLike(
  postId: string,
  shouldLike: boolean
): Promise<{ liked: boolean; likes: number | null }> {
  const base = API_BASE.replace(/\/+$/, "");
  const token = (loadSession() as { token?: string } | null)?.token;

  if (!token) {
    return { liked: shouldLike, likes: null };
  }

  const method = shouldLike ? "POST" : "DELETE";
  const url = `${base}/communaute/posts/${postId}/like`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json: unknown = await res.json().catch(() => null);

    if (isRecord(json)) {
      const data = isRecord(json.data)
        ? (json.data as Record<string, unknown>)
        : json;
      const srvLikes = toNumberOrNull(data["likes"]);
      const srvLiked = toBoolOrUndef(data["liked"]) ?? shouldLike;
      return { liked: srvLiked, likes: srvLikes };
    }
  } catch {
    /* ignore */
  }
  return { liked: shouldLike, likes: null };
}

/** Event bus: notifie la liste qu’un like a changé */
export function emitLikeChanged(detail: {
  id: string;
  liked: boolean;
  likes: number;
}) {
  window.dispatchEvent(new CustomEvent("fm:community:post:like", { detail }));
}
