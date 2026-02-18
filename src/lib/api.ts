// C:\Users\ADMIN\Desktop\fullmargin-site\src\lib\api.ts

/* =========================================================
   Erreurs & constantes
========================================================= */

export class ApiError extends Error {
  status: number;
  data: unknown;
  url: string;
  headers: Headers;

  constructor(
    status: number,
    message: string,
    data: unknown,
    url: string,
    headers: Headers,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
    this.headers = headers;
  }
}

/** Base API. En dev via Vite: "/api" → proxifié vers http://localhost:5179 */
const VITE_ENV =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env ?? {};

const ENV_BASE =
  VITE_ENV.VITE_API_BASE !== undefined
    ? String(VITE_ENV.VITE_API_BASE ?? "").trim()
    : "/api";

export const API_BASE: string = ENV_BASE || "/api";

/* =========================================================
   Utils généraux
========================================================= */

function isAbsoluteUrl(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

function trimSlashes(s: string): string {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

/** Joint correctement base (absolue ou relative) + path */
function joinUrl(base: string, path: string): string {
  if (isAbsoluteUrl(path)) return path;

  const p = path.startsWith("/") ? path : `/${path}`;
  if (isAbsoluteUrl(base)) {
    const b = base.replace(/\/+$/, "");
    return `${b}${p}`;
  } else {
    const b = "/" + trimSlashes(base || "/");
    const pp = trimSlashes(path);
    return pp ? `${b}/${pp}` : b;
  }
}

/* =========================================================
   Types & helpers de query string (EXPORTÉS)
========================================================= */

export type QueryPrimitive = string | number | boolean;

export type QueryValue =
  | QueryPrimitive
  | null
  | undefined
  | QueryPrimitive[]
  | Record<string, unknown>;

export type QueryRecord = Record<string, QueryValue>;

function toSearchParams(query?: QueryRecord): URLSearchParams {
  const sp = new URLSearchParams();
  if (!query) return sp;

  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;

    if (Array.isArray(v)) {
      v.forEach((vv) => {
        if (vv !== undefined && vv !== null) sp.append(k, String(vv));
      });
      return;
    }

    if (typeof v === "object") {
      sp.append(k, JSON.stringify(v));
      return;
    }

    // string | number | boolean
    sp.append(k, String(v));
  });

  return sp;
}

function isFormData(x: unknown): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/* =========================================================
   Session / Auth
========================================================= */

/** Récupère le token de la session stockée (fm:session) */
export function getStoredSession(): { token?: string } | null {
  const keys = ["fm:session", "auth:session", "session", "fm:auth"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      // essaie quelques chemins classiques
      const token =
        obj?.token ||
        obj?.data?.token ||
        obj?.session?.token ||
        obj?.user?.token;
      if (typeof token === "string" && token.length > 10) return { token };
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function getAuthToken(): string | null {
  return getStoredSession()?.token ?? null;
}

/* =========================================================
   API Core
========================================================= */

export type ApiInit = RequestInit & {
  json?: unknown; // Objet sérialisé automatiquement en JSON si fourni
  query?: QueryRecord; // Query string à ajouter
  withAuth?: boolean; // Ajoute Authorization: Bearer (défaut: true)
  timeoutMs?: number; // Timeout en ms (AbortController)
};

async function apiCore<T = unknown>(
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const {
    json,
    query,
    withAuth = true,
    timeoutMs,
    headers: initHeaders,
    body: initBody,
    cache = "no-store", // 👈 Force le réseau, pas de 304
    ...rest
  } = init;

  // URL
  let url = isAbsoluteUrl(path) ? path : joinUrl(API_BASE, path);
  const qs = toSearchParams(query);
  if ([...qs.keys()].length) {
    url += (url.includes("?") ? "&" : "?") + qs.toString();
  }

  // Headers
  const headers = new Headers(initHeaders || {});
  const hasAuthHeader = headers.has("Authorization");
  const hasContentType = headers.has("Content-Type");

  // Body
  let body: BodyInit | undefined = undefined;
  if (json !== undefined) {
    body = JSON.stringify(json);
    if (!hasContentType) headers.set("Content-Type", "application/json");
  } else if (initBody != null) {
    body = initBody as BodyInit;
    if (isFormData(body)) headers.delete("Content-Type");
  }

  // Auth
  if (withAuth && !hasAuthHeader) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Timeout
  const controller = timeoutMs ? new AbortController() : null;
  if (controller) setTimeout(() => controller.abort(), timeoutMs);

  // Requête
  const res = await fetch(url, {
    headers,
    body,
    cache, // 👈 important
    ...rest,
    signal: controller?.signal ?? rest.signal,
  });

  // 204/205 → pas de contenu
  if (res.status === 204 || res.status === 205) {
    return null as T;
  }

  // ---------- Parsing robuste (même si Content-Type est mauvais) ----------
  let payload: unknown = null;
  let text: string | null = null;
  try {
    text = await res.text(); // on lit une seule fois
    if (text) {
      try {
        payload = JSON.parse(text); // on tente toujours JSON
      } catch {
        payload = text; // sinon, on garde le texte brut
      }
    }
  } catch {
    payload = null;
  }

  if (!res.ok) {
    let msg: string;
    if (typeof payload === "string") {
      msg = payload;
    } else if (
      isRecord(payload) &&
      (typeof (payload as Record<string, unknown>).error === "string" ||
        typeof (payload as Record<string, unknown>).message === "string")
    ) {
      const p = payload as Record<string, unknown>;
      msg = (p.error as string) || (p.message as string);
    } else {
      msg = `${res.status} ${res.statusText}`;
    }
    throw new ApiError(res.status, msg, payload, url, res.headers);
  }

  return payload as T;
}

/* =========================================================
   Raccourcis HTTP
========================================================= */

export interface ApiWithShortcuts {
  <T = unknown>(path: string, init?: ApiInit): Promise<T>;
  get<T = unknown>(
    path: string,
    init?: Omit<ApiInit, "method" | "json">,
  ): Promise<T>;
  delete<T = unknown>(
    path: string,
    init?: Omit<ApiInit, "method" | "json">,
  ): Promise<T>;
  post<T = unknown>(
    path: string,
    json?: unknown,
    init?: Omit<ApiInit, "method" | "json">,
  ): Promise<T>;
  put<T = unknown>(
    path: string,
    json?: unknown,
    init?: Omit<ApiInit, "method" | "json">,
  ): Promise<T>;
  patch<T = unknown>(
    path: string,
    json?: unknown,
    init?: Omit<ApiInit, "method" | "json">,
  ): Promise<T>;
}

export const api: ApiWithShortcuts = Object.assign(apiCore, {
  get<T = unknown>(path: string, init: Omit<ApiInit, "method" | "json"> = {}) {
    return apiCore<T>(path, { ...init, method: "GET" });
  },

  delete<T = unknown>(
    path: string,
    init: Omit<ApiInit, "method" | "json"> = {},
  ) {
    return apiCore<T>(path, { ...init, method: "DELETE" });
  },

  post<T = unknown>(
    path: string,
    json?: unknown,
    init: Omit<ApiInit, "method" | "json"> = {},
  ) {
    return apiCore<T>(path, { ...init, method: "POST", json });
  },

  put<T = unknown>(
    path: string,
    json?: unknown,
    init: Omit<ApiInit, "method" | "json"> = {},
  ) {
    return apiCore<T>(path, { ...init, method: "PUT", json });
  },

  patch<T = unknown>(
    path: string,
    json?: unknown,
    init: Omit<ApiInit, "method" | "json"> = {},
  ) {
    return apiCore<T>(path, { ...init, method: "PATCH", json });
  },
});
