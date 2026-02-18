// src/lib/analytics.ts

import { loadSession } from "../auth/lib/storage";

type UABrand = { brand: string; version: string };
type UAHEValues = {
  brands?: UABrand[];
  mobile?: boolean;
  platform?: string;
  platformVersion?: string;
  model?: string;
  architecture?: string;
  bitness?: string;
  uaFullVersion?: string;
};

type UAHints = UAHEValues | null;

type ScreenInfo = { w: number; h: number; dpr: number };

type CommonPayload = {
  path: string;
  referrer?: string;
  url: string;
  search: string;
  title: string;
  lang: string;
  tz: string;
  screen: ScreenInfo;
  sessionId: string;
  visitorId: string;
  ua: string;
  hints: UAHints;
  cookieConsent: "accepted" | "declined" | "unknown";
};

type PageviewPayload = CommonPayload & {
  type: "pageview";
  ts?: string;
  dedupeKey?: string;
};
type LeavePayload = CommonPayload & {
  type: "leave";
  durationMs: number;
  ts?: string;
  dedupeKey?: string;
};
type ConsentPayload = Omit<CommonPayload, "path"> & {
  type: "consent";
  ts?: string;
};

// --- Env (sans any)
const VITE =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env ?? {};
const API_BASE =
  (VITE.VITE_API_URL && VITE.VITE_API_URL.replace(/\/$/, "")) ||
  "http://localhost:5179/api";
const ENDPOINT = `${API_BASE}/analytics/track`;

/* ---------- Kill switches / règles ---------- */
const EXCLUDE_ANY_AUTH =
  String(VITE.VITE_ANALYTICS_EXCLUDE_AUTHED ?? "0") === "1";

const INTERNAL_ROLE_SET = new Set([
  "admin",
  "agent",
  "superadmin",
  "staff",
  "support",
]);

function isTruth(v: unknown): boolean {
  return (
    v === true || String(v).toLowerCase() === "true" || v === 1 || v === "1"
  );
}

type LooseUser = Record<string, unknown> | null;

function getUserLike(): LooseUser {
  try {
    const s = loadSession() as { user?: Record<string, unknown> } | null;
    return s?.user ?? null;
  } catch {
    return null;
  }
}

function userIsInternal(u: LooseUser): boolean {
  if (!u) return false;

  // flags usuels
  if (isTruth((u as Record<string, unknown>).isAdmin)) return true;
  if (isTruth((u as Record<string, unknown>).isAgent)) return true;
  if (isTruth((u as Record<string, unknown>).isStaff)) return true;
  if (isTruth((u as Record<string, unknown>).internal)) return true;

  // role string
  const roleVal = (u as Record<string, unknown>).role;
  const role = typeof roleVal === "string" ? roleVal.toLowerCase().trim() : "";
  if (role && INTERNAL_ROLE_SET.has(role)) return true;

  // roles array
  const rolesVal =
    (u as Record<string, unknown>).roles ??
    (u as Record<string, unknown>).roleNames;
  if (Array.isArray(rolesVal)) {
    for (const r of rolesVal) {
      const v = String(r ?? "")
        .toLowerCase()
        .trim();
      if (INTERNAL_ROLE_SET.has(v)) return true;
    }
  }

  // scopes/permissions éventuels
  const scopesVal =
    (u as Record<string, unknown>).scopes ??
    (u as Record<string, unknown>).permissions;
  if (Array.isArray(scopesVal)) {
    for (const s of scopesVal) {
      const v = String(s ?? "")
        .toLowerCase()
        .trim();
      if (v.includes("admin") || v.includes("agent") || v.includes("staff"))
        return true;
    }
  }

  return false;
}

/** true => on NE DOIT PAS envoyer d'analytics */
function shouldSilenceAnalytics(): boolean {
  try {
    // Kill switch global runtime (utile pour débug)
    if (
      typeof window !== "undefined" &&
      (window as Window & { __FM_DISABLE_ANALYTICS__?: boolean })
        .__FM_DISABLE_ANALYTICS__ === true
    ) {
      return true;
    }

    const u = getUserLike();
    if (EXCLUDE_ANY_AUTH && u) return true; // coupe tout si authentifié (override env)
    if (userIsInternal(u)) return true; // coupe pour admin/agent/staff

    // sinon: visiteur anonyme (OK pour tracker)
    return false;
  } catch {
    return false;
  }
}

/* ---------- IDs & session ---------- */
const VISITOR_KEY = "fm:visitorId";
const SESSION_ID_KEY = "fm:sessionId";
const SESSION_TOUCH_KEY = "fm:sessionLast";
const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return (
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    );
  }
}

function getVisitorId(): string {
  try {
    const v = localStorage.getItem(VISITOR_KEY);
    if (v) return v;
    const id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return uuid();
  }
}

function getSessionId(): string {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(SESSION_TOUCH_KEY) || "0");
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (!sid || (last && now - last > SESSION_IDLE_MS)) {
      sid = uuid();
      localStorage.setItem(SESSION_ID_KEY, sid);
    }
    localStorage.setItem(SESSION_TOUCH_KEY, String(now));
    return sid!;
  } catch {
    return uuid();
  }
}

export function touchSession() {
  try {
    localStorage.setItem(SESSION_TOUCH_KEY, String(Date.now()));
  } catch {
    // ignore: storage indisponible (quota / mode privé)
    return;
  }
}
export function resetSession() {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_TOUCH_KEY);
  } catch {
    // ignore: storage indisponible (quota / mode privé)
    return;
  }
}

/* ---------- Contexte ---------- */
function getCookieConsent(): "accepted" | "declined" | "unknown" {
  try {
    const v = localStorage.getItem("cookieConsent");
    return v === "accepted" || v === "declined" ? v : "unknown";
  } catch {
    return "unknown";
  }
}

async function getUAHints(): Promise<UAHints> {
  try {
    type UAData = {
      getHighEntropyValues?: (
        hints: string[]
      ) => Promise<Record<string, unknown>>;
    };
    const nav = navigator as Navigator & { userAgentData?: UAData };
    const uaData = nav.userAgentData;
    if (!uaData?.getHighEntropyValues) return null;

    const vals = await uaData.getHighEntropyValues([
      "brands",
      "mobile",
      "platform",
      "platformVersion",
      "model",
      "architecture",
      "bitness",
      "uaFullVersion",
    ]);

    const brands = Array.isArray(vals.brands)
      ? (vals.brands as UABrand[])
      : undefined;

    return {
      brands,
      mobile: typeof vals.mobile === "boolean" ? vals.mobile : undefined,
      platform: typeof vals.platform === "string" ? vals.platform : undefined,
      platformVersion:
        typeof vals.platformVersion === "string"
          ? vals.platformVersion
          : undefined,
      model: typeof vals.model === "string" ? vals.model : undefined,
      architecture:
        typeof vals.architecture === "string" ? vals.architecture : undefined,
      bitness: typeof vals.bitness === "string" ? vals.bitness : undefined,
      uaFullVersion:
        typeof vals.uaFullVersion === "string" ? vals.uaFullVersion : undefined,
    };
  } catch {
    return null;
  }
}

function screenInfo(): ScreenInfo {
  try {
    return { w: screen.width, h: screen.height, dpr: devicePixelRatio || 1 };
  } catch {
    return { w: 0, h: 0, dpr: 1 };
  }
}

const nowIso = () => new Date().toISOString();

function makeDedupeKey(
  type: "pageview" | "leave",
  sessionId: string,
  path: string
): string {
  const bucket = Math.floor(Date.now() / 2000); // 2s bucket
  return `${type}:${sessionId}:${path}:${bucket}`;
}

async function buildCommon(
  path?: string,
  referrerOverride?: string
): Promise<CommonPayload> {
  const p = path || location.pathname;
  const ref =
    typeof referrerOverride === "string"
      ? referrerOverride
      : document.referrer || undefined;
  return {
    path: p,
    referrer: ref,
    url: location.href,
    search: location.search,
    title: document.title,
    lang: navigator.language || "en",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: screenInfo(),
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    ua: navigator.userAgent,
    hints: await getUAHints(),
    cookieConsent: getCookieConsent(),
  };
}

/* ---------- Transport (NO credentials & pas de preflight) ---------- */
// Beacon: envoie une string => content-type implicite text/plain (pas de preflight)
function postBeacon(url: string, data: unknown): boolean {
  try {
    if (!("sendBeacon" in navigator)) return false;
    const body = JSON.stringify(data);
    return navigator.sendBeacon(
      url,
      new Blob([body], { type: "text/plain;charset=UTF-8" })
    );
  } catch {
    return false;
  }
}

// Fallback fetch: pas de headers, body string => text/plain simple request
async function postPlain(url: string, data: unknown, keepalive = false) {
  try {
    await fetch(url, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      body: JSON.stringify(data),
      keepalive,
    });
  } catch {
    // ignore: réseau/balise bloquée, non bloquant pour l'app
    return;
  }
}

/* ---------- API ---------- */
export async function trackPageview(path?: string, referrer?: string) {
  if (shouldSilenceAnalytics()) return; // 🚫 rien n'envoie si admin/agent (ou override)
  const ctx = await buildCommon(path, referrer);
  const payload: PageviewPayload = {
    type: "pageview",
    ...ctx,
    ts: nowIso(),
    dedupeKey: makeDedupeKey("pageview", ctx.sessionId, ctx.path),
  };
  if (postBeacon(ENDPOINT, payload)) return;
  await postPlain(ENDPOINT, payload);
}

export async function trackLeave(path: string | undefined, startedAt: number) {
  if (shouldSilenceAnalytics()) return; // 🚫
  const ctx = await buildCommon(path);
  const payload: LeavePayload = {
    type: "leave",
    ...ctx,
    durationMs: Math.max(0, Date.now() - startedAt),
    ts: nowIso(),
    dedupeKey: makeDedupeKey("leave", ctx.sessionId, ctx.path),
  };
  if (postBeacon(ENDPOINT, payload)) return;
  await postPlain(ENDPOINT, payload, true);
}

export async function trackConsent(status: "accepted" | "declined") {
  // Met à jour le localStorage quoi qu'il arrive
  try {
    localStorage.setItem("cookieConsent", status);
  } catch {
    // ignore: storage indisponible (quota / mode privé)
    return;
  }

  if (shouldSilenceAnalytics()) return; // 🚫 pas d’event consent externe si interne

  const ctx = await buildCommon();
  const payload: ConsentPayload = {
    type: "consent",
    ...ctx,
    cookieConsent: status,
    ts: nowIso(),
  };
  if (postBeacon(ENDPOINT, payload)) return;
  await postPlain(ENDPOINT, payload);
}

/* ---------- Helper runtime facultatif ---------- */
// window.__FM_DISABLE_ANALYTICS__ = true;
declare global {
  interface Window {
    __FM_DISABLE_ANALYTICS__?: boolean;
  }
}
