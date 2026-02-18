// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\wishlist.ts
import { useSyncExternalStore } from "react";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ============== CONFIG ============== */
const EVT_REMOTE = "fm:wishlist:remote";
type SyncMode = "server";
type SyncConfig = {
  baseUrl?: string;
  getToken?: () => string | null;
  mode?: SyncMode;
};

const cfg: SyncConfig = {
  baseUrl: `${API_BASE}/marketplace/profile`,
  mode: "server",
};

/* ============== HELPERS ============== */
const isBrowser = () => typeof window !== "undefined";
const getBaseUrl = () => cfg.baseUrl || `${API_BASE}/marketplace/profile`;
const getToken = () => cfg.getToken?.() || loadSession()?.token || null;

function authHeadersJSON(): Headers {
  const h = new Headers({ "Content-Type": "application/json" });
  const t = getToken();
  if (t) h.set("Authorization", `Bearer ${t}`);
  return h;
}
function authHeaders(): Headers {
  const h = new Headers();
  const t = getToken();
  if (t) h.set("Authorization", `Bearer ${t}`);
  return h;
}

// 🔐
function ensureAuth(): boolean {
  const t = getToken();
  if (!t && isBrowser()) {
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
    );
    return false;
  }
  return !!t;
}

/* ============== ÉTAT LOCAL (mémoire) ============== */
let remoteJSON = "[]";

function emitRemote() {
  if (isBrowser()) window.dispatchEvent(new Event(EVT_REMOTE));
}

/* ============== READ/WRITE LOCAL ============== */
function readIds(): string[] {
  try {
    const arr = JSON.parse(remoteJSON) as string[];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function setLocal(ids: string[]) {
  remoteJSON = JSON.stringify([...new Set(ids)]);
  emitRemote();
}

/* ============== FETCH HELPERS ============== */
async function fetchWishlist(): Promise<{
  ids: string[];
  updatedAt?: string | null;
}> {
  const token = getToken();
  if (!token) {
    setLocal([]);
    return { ids: [], updatedAt: null };
  }

  const res = await fetch(`${getBaseUrl()}/wishlist`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    setLocal([]);
    return { ids: [], updatedAt: null };
  }
  if (!res.ok) throw new Error("wishlist_get_failed");
  const json = await res.json();
  const ids = (json?.data?.ids || []) as string[];
  const updatedAt = json?.data?.updatedAt || null;
  return { ids, updatedAt };
}

async function addServer(id: string): Promise<string[]> {
  const token = getToken();
  if (!token) return [];

  const res = await fetch(
    `${getBaseUrl()}/wishlist/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  if (res.ok) {
    const json = await res.json();
    return (json?.data?.ids || []) as string[];
  }

  const current = readIds();
  const next = [...new Set([id, ...current])];
  const put = await fetch(`${getBaseUrl()}/wishlist`, {
    method: "PUT",
    headers: authHeadersJSON(),
    body: JSON.stringify({ ids: next }),
  });
  if (!put.ok) throw new Error("wishlist_put_failed");
  const j = await put.json();
  return (j?.data?.ids || []) as string[];
}

async function removeServer(id: string): Promise<string[]> {
  const token = getToken();
  if (!token) return [];

  const res = await fetch(
    `${getBaseUrl()}/wishlist/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
  if (res.ok) {
    const json = await res.json();
    return (json?.data?.ids || []) as string[];
  }

  const current = readIds();
  const next = current.filter((x) => x !== id);
  const put = await fetch(`${getBaseUrl()}/wishlist`, {
    method: "PUT",
    headers: authHeadersJSON(),
    body: JSON.stringify({ ids: next }),
  });
  if (!put.ok) throw new Error("wishlist_put_failed");
  const j = await put.json();
  return (j?.data?.ids || []) as string[];
}

/* ============== REVALIDATION CATALOGUE ============== */
async function revalidateAgainstCatalog(): Promise<void> {
  const ids = readIds();
  if (!ids.length) return;
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/public/products?ids=${encodeURIComponent(
        [...new Set(ids)].sort().join(",")
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const json = await res.json();
    const present = new Set<string>(
      ((json?.data?.items || []) as Array<{ id: string }>).map((p) => p.id)
    );
    const filtered = ids.filter((id) => present.has(id));
    const changed =
      filtered.length !== ids.length || filtered.some((v, i) => v !== ids[i]);
    if (changed) {
      setLocal(filtered);
      if (getToken()) {
        const put = await fetch(`${getBaseUrl()}/wishlist`, {
          method: "PUT",
          headers: authHeadersJSON(),
          body: JSON.stringify({ ids: filtered }),
        });
        if (put.ok) {
          const j = await put.json();
          const server = (j?.data?.ids || []) as string[];
          setLocal(server);
        }
      }
    }
  } catch {
    // silencieux
  }
}

/* ============== API LOCALE ============== */
export function getIds(): string[] {
  return readIds();
}
export async function setIds(ids: string[]): Promise<void> {
  if (!ensureAuth()) return;
  const res = await fetch(`${getBaseUrl()}/wishlist`, {
    method: "PUT",
    headers: authHeadersJSON(),
    body: JSON.stringify({ ids: [...new Set(ids)] }),
  });
  if (!res.ok) throw new Error("wishlist_put_failed");
  const j = await res.json();
  const server = (j?.data?.ids || []) as string[];
  setLocal(server);
  await revalidateAgainstCatalog();
}
export function has(id: string): boolean {
  return readIds().includes(id);
}
export async function add(id: string): Promise<void> {
  if (!ensureAuth()) return;
  const cur = readIds();
  if (!cur.includes(id)) setLocal([id, ...cur]);
  try {
    const server = await addServer(id);
    setLocal(server);
    await revalidateAgainstCatalog();
  } catch {
    const { ids } = await fetchWishlist();
    setLocal(ids);
    await revalidateAgainstCatalog();
  }
}
export async function remove(id: string): Promise<void> {
  if (!ensureAuth()) return;
  const cur = readIds();
  if (cur.includes(id)) setLocal(cur.filter((x) => x !== id));
  try {
    const server = await removeServer(id);
    setLocal(server);
    await revalidateAgainstCatalog();
  } catch {
    const { ids } = await fetchWishlist();
    setLocal(ids);
    await revalidateAgainstCatalog();
  }
}
export async function toggle(id: string, next?: boolean): Promise<void> {
  const present = has(id);
  const should = typeof next === "boolean" ? next : !present;
  if (should) await add(id);
  else await remove(id);
}
export async function clear(): Promise<void> {
  if (!ensureAuth()) return;
  setLocal([]);
  try {
    const res = await fetch(`${getBaseUrl()}/wishlist`, {
      method: "PUT",
      headers: authHeadersJSON(),
      body: JSON.stringify({ ids: [] }),
    });
    if (!res.ok) throw new Error("wishlist_clear_failed");
    const j = await res.json();
    const server = (j?.data?.ids || []) as string[];
    setLocal(server);
  } catch {
    const { ids } = await fetchWishlist();
    setLocal(ids);
  }
}

/* ============== RÉACTIVITÉ ============== */
function subscribe(cb: () => void) {
  if (!isBrowser()) return () => {};
  const h = () => cb();
  window.addEventListener(EVT_REMOTE, h);
  return () => {
    window.removeEventListener(EVT_REMOTE, h);
  };
}
function getSnapshot() {
  return remoteJSON;
}
function getServerSnapshot() {
  return "[]";
}

export function useWishlistIds(): string[] {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}
export function useWishlistCount(): number {
  return useWishlistIds().length;
}
export function useWishlistHas(id: string): boolean {
  return useWishlistIds().includes(id);
}

/* ============== BOOT ============== */
if (isBrowser()) {
  (async () => {
    try {
      const t = getToken();
      if (!t) {
        setLocal([]);
        return;
      }
      const { ids } = await fetchWishlist();
      setLocal(ids);
      await revalidateAgainstCatalog();
    } catch {
      // silencieux
    }
  })();
}

/* ============== FACADE ============== */
export const wishlistActions = {
  add,
  remove,
  toggle,
  clear,
  set: setIds,
  has,
  getIds,
};
