// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\cart.ts
import { useSyncExternalStore } from "react";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/* ============== CONFIG ============== */
const EVT_REMOTE = "fm:cart:remote";
const EVT_CHECKOUT_SUCCESS = "fm:checkout:success";
const EVT_AUTH_CHANGED = "fm:auth:changed";

export type CartItem = { id: string; qty: number };

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

/* ============== NORMALISATION ============== */
function normalize(items: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const raw of Array.isArray(items) ? items : []) {
    const id = String((raw as CartItem)?.id ?? "");
    const qty = Math.max(0, Number((raw as CartItem)?.qty) || 0);
    if (!id || qty <= 0) continue;
    map.set(id, (map.get(id) || 0) + qty);
  }
  return Array.from(map, ([id, qty]) => ({ id, qty })).filter((x) => x.qty > 0);
}

/* ============== LOCAL READ/WRITE ============== */
function read(): CartItem[] {
  try {
    const arr = JSON.parse(remoteJSON) as CartItem[];
    return normalize(arr);
  } catch {
    return [];
  }
}
function setLocal(items: CartItem[]) {
  const cleaned = normalize(items);
  remoteJSON = JSON.stringify(cleaned);
  emitRemote();
}

/* ============== FETCH HELPERS ============== */
async function fetchCart(): Promise<{
  items: CartItem[];
  updatedAt?: string | null;
}> {
  const token = getToken();
  // ⛔ pas de token → pas d’appel → pas de 401
  if (!token) {
    setLocal([]);
    return { items: [], updatedAt: null };
  }

  const res = await fetch(`${getBaseUrl()}/cart`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    setLocal([]);
    return { items: [], updatedAt: null };
  }
  if (!res.ok) throw new Error("cart_get_failed");
  const json = await res.json();
  const items = (json?.data?.items || []) as CartItem[];
  return { items: normalize(items), updatedAt: json?.data?.updatedAt || null };
}

async function putCart(items: CartItem[]): Promise<CartItem[]> {
  const token = getToken();
  if (!token) {
    // visiteur → on ne tente rien côté serveur
    setLocal([]);
    return [];
  }

  const res = await fetch(`${getBaseUrl()}/cart`, {
    method: "PUT",
    headers: authHeadersJSON(),
    body: JSON.stringify({ items: normalize(items) }),
  });
  if (!res.ok) throw new Error("cart_put_failed");
  const j = await res.json();
  return normalize((j?.data?.items || []) as CartItem[]);
}

async function setLineServer(id: string, qty: number): Promise<CartItem[]> {
  const token = getToken();
  if (!token) {
    return [];
  }

  const res = await fetch(`${getBaseUrl()}/cart/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeadersJSON(),
    body: JSON.stringify({ qty: Math.max(0, Number(qty) || 0) }),
  });
  if (res.ok) {
    const json = await res.json();
    return normalize((json?.data?.items || []) as CartItem[]);
  }

  const current = read();
  const i = current.findIndex((x) => x.id === id);
  const q = Math.max(0, Number(qty) || 0);
  const next = [...current];
  if (q <= 0) {
    if (i >= 0) next.splice(i, 1);
  } else if (i >= 0) {
    next[i] = { id, qty: q };
  } else {
    next.unshift({ id, qty: q });
  }
  return await putCart(next);
}

/* ============== REVALIDATION CATALOGUE ============== */
async function revalidateAgainstCatalog(): Promise<void> {
  const items = read();
  if (!items.length) return;
  try {
    const ids = [...new Set(items.map((i) => i.id))];
    const res = await fetch(
      `${API_BASE}/marketplace/public/products?ids=${encodeURIComponent(
        ids.sort().join(",")
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;

    const json = await res.json();
    const present = new Set<string>(
      ((json?.data?.items || []) as Array<{ id: string }>).map((p) => p.id)
    );

    const filtered = items.filter((i) => present.has(i.id) && i.qty > 0);
    const changed =
      filtered.length !== items.length ||
      filtered.some(
        (f, idx) => f.id !== items[idx]?.id || f.qty !== items[idx]?.qty
      );

    if (changed) {
      setLocal(filtered);
      // on met à jour côté serveur seulement si connecté
      if (getToken()) {
        const server = await putCart(filtered);
        setLocal(server);
      }
    }
  } catch {
    // silencieux
  }
}

/* ============== API SYNCHRONE ============== */
export function getItems(): CartItem[] {
  return read();
}

export async function clear(): Promise<void> {
  if (!ensureAuth()) return;
  setLocal([]);
  try {
    const server = await putCart([]);
    setLocal(server);
  } catch {
    const { items } = await fetchCart();
    setLocal(items);
  }
}

export function getQty(id: string): number {
  return read().find((x) => x.id === id)?.qty ?? 0;
}
export function has(id: string): boolean {
  return getQty(id) > 0;
}

export async function setQty(id: string, qty: number): Promise<void> {
  if (!ensureAuth()) return;
  const cur = read();
  const i = cur.findIndex((x) => x.id === id);
  const q = Math.max(0, Number(qty) || 0);
  const next = [...cur];
  if (q <= 0) {
    if (i >= 0) next.splice(i, 1);
  } else if (i >= 0) {
    next[i] = { id, qty: q };
  } else {
    next.unshift({ id, qty: q });
  }
  setLocal(next);

  try {
    const server = await setLineServer(id, q);
    setLocal(server);
    await revalidateAgainstCatalog();
  } catch {
    const { items } = await fetchCart();
    setLocal(items);
    await revalidateAgainstCatalog();
  }
}

export async function add(id: string, delta = 1): Promise<void> {
  const q = Math.max(0, getQty(id) + Number(delta || 0));
  await setQty(id, q);
}
export async function remove(id: string, delta = 1): Promise<void> {
  const q = Math.max(0, getQty(id) - Number(delta || 0));
  await setQty(id, q);
}
export async function toggle(id: string): Promise<void> {
  await setQty(id, has(id) ? 0 : 1);
}

export function exportForCheckout(): CartItem[] {
  return read();
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

export function useCartCount(): number {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    const items = JSON.parse(json) as CartItem[];
    return items.reduce(
      (s, it) => s + (Number.isFinite(it.qty) ? it.qty : 0),
      0
    );
  } catch {
    return 0;
  }
}
export function useCartDistinctCount(): number {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    const items = JSON.parse(json) as CartItem[];
    return items.filter((it) => it.qty > 0).length;
  } catch {
    return 0;
  }
}
export function useCartItems(): CartItem[] {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    return normalize(JSON.parse(json) as CartItem[]);
  } catch {
    return [];
  }
}
export function useCartQty(id: string): number {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    const items = JSON.parse(json) as CartItem[];
    return items.find((x) => x.id === id)?.qty ?? 0;
  } catch {
    return 0;
  }
}
export function useCartHas(id: string): boolean {
  return useCartQty(id) > 0;
}

/* ============== BOOT ============== */
async function bootFromServer() {
  try {
    const t = getToken();
    if (!t) {
      setLocal([]);
      return;
    }
    const { items } = await fetchCart();
    setLocal(items);
    await revalidateAgainstCatalog();
  } catch {
    // silencieux
  }
}

if (isBrowser()) {
  bootFromServer();

  window.addEventListener(EVT_CHECKOUT_SUCCESS, async () => {
    try {
      if (getToken()) {
        await putCart([]);
      }
    } catch (err) {
      // on ignore volontairement : échec de purge serveur après paiement
      console.debug("cart: purge after checkout failed", err);
    } finally {
      setLocal([]);
    }
  });

  window.addEventListener(EVT_AUTH_CHANGED, () => {
    bootFromServer();
  });
}

/* ============== FACADE ============== */
export const cartActions = {
  add,
  remove,
  setQty,
  clear,
  toggle,
  has,
  getItems,
  getQty,
  exportForCheckout,
};
