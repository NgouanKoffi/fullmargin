// C:\Users\ADMIN\Desktop\fullmargin-site\src\router\checkoutGate.ts

const isBrowser = () => typeof window !== "undefined";

const SESSION_GATE = "checkout:gate"; // ticket d'accès au checkout
const SESSION_INTENT = "checkout:intent:v1"; // intention Buy-Now (JSON)

function ssSet(key: string, val: string): boolean {
  try {
    if (!isBrowser()) return false;
    sessionStorage.setItem(key, val);
    return true;
  } catch {
    return false;
  }
}
function ssGet(key: string): string | null {
  try {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function ssRemove(key: string): boolean {
  try {
    if (!isBrowser()) return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Accorde un ticket d'accès au checkout pour cette session */
export function grantCheckoutGate(): void {
  ssSet(SESSION_GATE, "1");
}
/** Vérifie si un ticket d'accès est présent */
export function hasCheckoutGate(): boolean {
  return ssGet(SESSION_GATE) === "1";
}
/** Révoque le ticket (appelé quand on quitte le checkout) */
export function revokeCheckoutGate(): void {
  ssRemove(SESSION_GATE);
}

/** Intention Buy-Now (sans toucher au panier) */
export type CheckoutIntentItem = { id: string; qty: number };
export type CheckoutIntent = { mode: "buy_now"; items: CheckoutIntentItem[] };

export function setCheckoutIntent(items: CheckoutIntentItem[]): void {
  const cleaned = (items || [])
    .map((it) => ({
      id: String(it.id),
      qty: Math.max(1, Number(it.qty) || 1),
    }))
    .filter((it) => it.id && it.qty > 0);

  if (cleaned.length === 0) {
    ssRemove(SESSION_INTENT);
    return;
  }
  ssSet(SESSION_INTENT, JSON.stringify({ mode: "buy_now", items: cleaned }));
}

/* ---------- Type guards & normalisation ---------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type RawItem = { id?: unknown; qty?: unknown };
type RawIntent = { mode?: unknown; items?: unknown };

function isRawIntent(obj: unknown): obj is RawIntent {
  if (!isRecord(obj)) return false;
  if (obj.mode !== "buy_now") return false;
  if (!Array.isArray(obj.items) || obj.items.length === 0) return false;
  return obj.items.every((it) => isRecord(it) && "id" in it && "qty" in it);
}

/** Accepte unknown, vérifie et retourne une CheckoutIntent propre ou null */
function normalizeIntent(raw: unknown): CheckoutIntent | null {
  if (!isRawIntent(raw)) return null;
  const items: CheckoutIntentItem[] = (raw.items as unknown[]).map((it) => {
    const r = it as RawItem;
    return {
      id: String(r.id),
      qty: Math.max(1, toNumber(r.qty, 1)),
    };
  });
  const cleaned = items.filter((i) => i.id && i.qty > 0);
  if (cleaned.length === 0) return null;
  return { mode: "buy_now", items: cleaned };
}

export function getCheckoutIntent(): CheckoutIntent | null {
  const raw = ssGet(SESSION_INTENT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeIntent(parsed);
  } catch {
    // JSON invalide → nettoyer pour éviter de retomber ici
    ssRemove(SESSION_INTENT);
    return null;
  }
}

export function hasCheckoutIntent(): boolean {
  return getCheckoutIntent() !== null;
}

export function clearCheckoutIntent(): void {
  ssRemove(SESSION_INTENT);
}
