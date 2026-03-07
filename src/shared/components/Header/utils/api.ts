import { API_BASE as RAW_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function pathVariants(p: string): string[] {
  const a = p.replace("/communautes/", "/communaute/");
  const b = p.replace("/communaute/", "/communautes/");
  return Array.from(new Set([p, a, b]));
}

export async function fetchWithFallback(
  paths: string[],
  init: RequestInit = {}
): Promise<Response> {
  let lastErr: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        cache: "no-store",
        ...init,
        headers: {
          ...(init.headers || {}),
          "Cache-Control": "no-store",
          ...authHeaders(),
        },
      });
      if (res.status !== 404) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  return new Response(JSON.stringify({ ok: false }), {
    status: lastErr ? 500 : 404,
  });
}
