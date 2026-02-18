// src/pages/journal/api.ts
import { api, ApiError } from "../../lib/api";
import type { JournalEntry, Currency } from "./types";

/* =============================================================================
 * Types exposés
 * ========================================================================== */

// ❗ on étend la version "liste" pour que la page performance ait tout
export type JournalListItem = {
  id: string;
  date: string;

  accountId: string;
  accountName: string;
  marketId: string;
  marketName: string;
  strategyId: string;
  strategyName: string;

  // résultat
  result: "Gain" | "Perte" | "Nul" | "";
  resultMoney: string;
  resultPct: string;

  createdAt: string; // [NEW] Needed for JournalEntryExt compatibility

  // 🔥 champs dont la vue performance a besoin
  invested: string; // montant investi
  order: "Buy" | "Sell" | "";
  lot: string;    // [NEW]
  detail: string; // [NEW]
  comment: string; // [NEW]

  respect: "Oui" | "Non" | "";
  duration?: string;
  timeframes?: string[];
  session?: "london" | "newyork" | "asiatique" | "";

  updatedAt: string;

  imageDataUrl?: string;
  imageUrl?: string;
  images?: string[];
};

// 🔴 ICI : on ajoute images?: string[] au type du document
export type JournalDoc = JournalEntry & {
  images?: string[];
};

export type MarketDoc = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
};

export type StrategyDoc = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
};

export type JournalAccountDoc = {
  id: string;
  name: string;
  currency: Currency;
  initial: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
};

// alias pratique pour l’UI des comptes
export type Account = JournalAccountDoc;

/** Devise serveur (fiat uniquement) */
type ServerCurrency =
  | "USD"
  | "EUR"
  | "XOF"
  | "XAF"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CNY"
  | "CHF"
  | "NGN"
  | "ZAR"
  | "MAD"
  | "INR"
  | "AED"
  | "GHS"
  | "KES";

type UpdateJournalAccountBody = Partial<{
  name: string;
  currency: ServerCurrency | string;
  initial: number;
  description?: string;
}>;

/* =============================================================================
 * Helpers communs
 * ========================================================================== */

const ORDER_VALUES = ["Buy", "Sell", ""] as const;
const RESULT_VALUES = ["Gain", "Perte", "Nul", ""] as const;
const RESPECT_VALUES = ["Oui", "Non", ""] as const;
const SESSION_VALUES = ["london", "newyork", "asiatique", ""] as const;

/**
 * mapping UI -> serveur
 */
const UI_TO_SERVER: Partial<Record<Currency, ServerCurrency>> = {
  USD: "USD",
  EUR: "EUR",
  FCFA: "XOF",
  FCFA_BEAC: "XAF",
  XOF: "XOF",
  XAF: "XAF",
  GBP: "GBP",
  JPY: "JPY",
  CAD: "CAD",
  AUD: "AUD",
  CNY: "CNY",
  CHF: "CHF",
  NGN: "NGN",
  ZAR: "ZAR",
  MAD: "MAD",
  INR: "INR",
  AED: "AED",
  GHS: "GHS",
  KES: "KES",
};

function toServerCurrency(c: Currency): ServerCurrency | undefined {
  return UI_TO_SERVER[c];
}

const CLIENT_CURRENCIES: Currency[] = [
  "USD",
  "EUR",
  "FCFA",
  "FCFA_BEAC",
  "XOF",
  "XAF",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "CHF",
  "NGN",
  "ZAR",
  "MAD",
  "INR",
  "AED",
  "GHS",
  "KES",
];

function toClientCurrency(v: unknown): Currency {
  const s = String(v ?? "").toUpperCase();
  if (s === "XOF") return "FCFA";
  if (s === "XAF") return "FCFA_BEAC";
  return CLIENT_CURRENCIES.includes(s as Currency) ? (s as Currency) : "USD";
}

function asRec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function get(obj: unknown, path: readonly (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur && typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[String(k)];
    } else {
      return undefined;
    }
  }
  return cur;
}

function toISO(d: unknown): string {
  try {
    const raw =
      typeof d === "string" || typeof d === "number" || d instanceof Date
        ? d
        : String(d ?? "");
    const dt = new Date(raw as string | number | Date);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
  } catch {
    return "";
  }
}

function normalize<T = unknown>(raw: unknown): T {
  if (
    raw &&
    typeof raw === "object" &&
    "ok" in (raw as Record<string, unknown>)
  ) {
    const r = raw as {
      ok?: unknown;
      data?: unknown;
      error?: unknown;
      message?: unknown;
    };
    if (r.ok === true) return (r.data ?? {}) as T;
    const msg = String(r.error ?? r.message ?? "Erreur API");
    throw new ApiError(400, msg, raw, "(client-normalize)", new Headers());
  }
  return raw as T;
}

function coerce<T extends readonly string[]>(
  v: unknown,
  allowed: T
): T[number] {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T[number])
    : ("" as T[number]);
}

/* =============================================================================
 * Pickers — journal entries
 * ========================================================================== */

// ✅ liste : on garde bien marketName / strategyName + images + TOUS les champs utiles
function pickJournalList(j: unknown): {
  items: JournalListItem[];
  nextCursor: string | null;
} {
  const d = normalize<unknown>(j);
  const fallback = Array.isArray(d) ? (d as unknown[]) : [];
  const arr = (get(d, ["items"]) ??
    get(d, ["data", "items"]) ??
    fallback) as unknown;
  if (!Array.isArray(arr)) {
    throw new Error("Réponse inattendue (liste journal)");
  }

  const items: JournalListItem[] = arr.map((raw) => {
    const x = asRec(raw);

    // on garde le tableau d’images renvoyé par le backend
    const imgs = Array.isArray(x.images)
      ? (x.images as unknown[])
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return {
      id: String(x.id ?? x._id ?? ""),
      date: String(x.date ?? ""),

      accountId: String(x.accountId ?? ""),
      accountName: String(x.accountName ?? ""),
      marketId: String(x.marketId ?? ""),
      marketName: String(x.marketName ?? ""),
      strategyId: String(x.strategyId ?? ""),
      strategyName: String(x.strategyName ?? ""),

      // résultat
      result: coerce(x.result, RESULT_VALUES),
      resultMoney: String(x.resultMoney ?? ""),
      resultPct: String(x.resultPct ?? ""),

      // 🔥 champs pour la vue performance
      invested: String(x.invested ?? ""),
      order: coerce(x.order, ORDER_VALUES),
      lot: String(x.lot ?? ""),
      detail: String(x.detail ?? ""),
      comment: String(x.comment ?? ""),
      
      respect: coerce(x.respect, RESPECT_VALUES),
      duration: String(x.duration ?? ""),
      timeframes: Array.isArray(x.timeframes)
        ? (x.timeframes as unknown[]).map((t) => String(t ?? ""))
        : [],
      session: coerce(x.session, SESSION_VALUES),

      updatedAt: String(x.updatedAt ?? toISO(x.updatedAt ?? "")),
      createdAt: String(x.createdAt ?? toISO(x.createdAt ?? "")),

      imageDataUrl: String(x.imageDataUrl ?? x.imageUrl ?? ""),
      imageUrl: String(x.imageUrl ?? x.imageDataUrl ?? ""),
      images: imgs,
    };
  });

  const next = (get(d, ["nextCursor"]) ??
    get(d, ["data", "nextCursor"]) ??
    null) as string | null;

  return { items, nextCursor: next };
}

// ✅ doc : même chose, on garde noms + 5 images
function pickJournalEntry(j: unknown): JournalDoc {
  const d = normalize<unknown>(j);
  const fallback =
    d && (asRec(d).id || asRec(d)._id || asRec(d).accountId) ? d : null;
  const e = get(d, ["entry"]) ?? get(d, ["data", "entry"]) ?? fallback;
  if (!e) throw new Error("Réponse inattendue (entrée journal)");
  const r = asRec(e);

  const images = Array.isArray(r.images)
    ? (r.images as unknown[])
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const doc: JournalDoc = {
    id: String(r.id ?? r._id ?? ""),
    accountId: String(r.accountId ?? ""),
    accountName: String(r.accountName ?? ""),
    marketId: String(r.marketId ?? ""),
    marketName: String(r.marketName ?? ""),
    strategyId: String(r.strategyId ?? ""),
    strategyName: String(r.strategyName ?? ""),

    order: coerce(r.order, ORDER_VALUES) as JournalDoc["order"],
    lot: String(r.lot ?? ""),
    result: coerce(r.result, RESULT_VALUES) as JournalDoc["result"],
    detail: String(r.detail ?? ""),

    invested: String(r.invested ?? ""),
    resultMoney: String(r.resultMoney ?? ""),
    resultPct: String(r.resultPct ?? ""),

    respect: coerce(r.respect, RESPECT_VALUES) as JournalDoc["respect"],
    duration: String(r.duration ?? ""),

    timeframes: Array.isArray(r.timeframes)
      ? (r.timeframes as unknown[]).map(String)
      : [],
    session: coerce(r.session, SESSION_VALUES) as JournalDoc["session"],

    comment: String(r.comment ?? ""),

    imageDataUrl: String(r.imageDataUrl ?? r.imageUrl ?? ""),
    imageUrl: String(r.imageUrl ?? ""),

    // 👇 important : on renvoie au front le tableau complet
    images,

    date: String(r.date ?? ""),
    createdAt: String(r.createdAt ?? toISO(r.createdAt ?? "")),
  };
  return doc;
}

function pickIdUpdated(j: unknown): { id: string; updatedAt: string } {
  const d = normalize<unknown>(j);
  const id = String(
    get(d, ["id"]) ??
      get(d, ["data", "id"]) ??
      get(d, ["entry", "id"]) ??
      get(d, ["data", "entry", "id"]) ??
      ""
  );
  const updatedAt = String(
    get(d, ["updatedAt"]) ??
      get(d, ["data", "updatedAt"]) ??
      get(d, ["entry", "updatedAt"]) ??
      get(d, ["data", "entry", "updatedAt"]) ??
      ""
  );
  if (!id) throw new Error("Réponse inattendue (création)");
  return { id, updatedAt };
}

function pickUpdated(j: unknown): { updatedAt: string } {
  const d = normalize<unknown>(j);
  const u = String(
    get(d, ["updatedAt"]) ??
      get(d, ["data", "updatedAt"]) ??
      get(d, ["entry", "updatedAt"]) ??
      get(d, ["data", "entry", "updatedAt"]) ??
      ""
  );
  return { updatedAt: u };
}

function pickDeleted(j: unknown): { deleted: boolean } {
  const d = normalize<unknown>(j);
  const del = get(d, ["deleted"]) ?? get(d, ["data", "deleted"]);
  return { deleted: !!del };
}

/* =============================================================================
 * Pickers — listes simples (marchés / stratégies)
 * ========================================================================== */

function pickSimpleList<
  T extends { id: string; name: string; createdAt: string; updatedAt?: string }
>(j: unknown): { items: T[]; nextCursor: string | null } {
  const d = normalize<unknown>(j);
  const fallback = Array.isArray(d) ? (d as unknown[]) : [];
  const arr = (get(d, ["items"]) ??
    get(d, ["data", "items"]) ??
    fallback) as unknown;
  if (!Array.isArray(arr)) {
    throw new Error("Réponse inattendue (liste simple)");
  }

  const items = arr.map((raw) => {
    const x = asRec(raw);
    return {
      id: String(x.id ?? x._id ?? ""),
      name: String(x.name ?? ""),

      createdAt: String(x.createdAt ?? toISO(x.createdAt ?? "")),
      updatedAt: String(x.updatedAt ?? toISO(x.updatedAt ?? "")) || undefined,
    } as T;
  });

  const next = (get(d, ["nextCursor"]) ??
    get(d, ["data", "nextCursor"]) ??
    null) as string | null;

  return { items, nextCursor: next };
}

function pickSimpleDoc<
  T extends { id: string; name: string; createdAt: string; updatedAt?: string }
>(j: unknown): T {
  const d = normalize<unknown>(j);
  const fallback =
    d && (asRec(d).id || asRec(d)._id || asRec(d).name) ? d : null;
  const e = get(d, ["item"]) ?? get(d, ["data", "item"]) ?? fallback;
  if (!e) {
    throw new Error("Réponse inattendue (document simple)");
  }
  const x = asRec(e);
  return {
    id: String(x.id ?? x._id ?? ""),
    name: String(x.name ?? ""),
    createdAt: String(x.createdAt ?? toISO(x.createdAt ?? "")),
    updatedAt: String(x.updatedAt ?? toISO(x.updatedAt ?? "")) || undefined,
  } as T;
}

/* =============================================================================
 * Pickers — comptes
 * ========================================================================== */

function pickAccountList(j: unknown): {
  items: JournalAccountDoc[];
  nextCursor: string | null;
} {
  const d = normalize<unknown>(j);
  const fallback = Array.isArray(d) ? (d as unknown[]) : [];
  const arr = (get(d, ["items"]) ??
    get(d, ["data", "items"]) ??
    fallback) as unknown;
  if (!Array.isArray(arr)) {
    throw new Error("Réponse inattendue (liste comptes)");
  }

  const items: JournalAccountDoc[] = arr.map((raw) => {
    const a = asRec(raw);
    return {
      id: String(a.id ?? a._id ?? a.accountId ?? ""),
      name: String(a.name ?? a.accountName ?? "").trim(),
      currency: toClientCurrency(a.currency ?? "USD"),
      initial: Number(a.initial) || 0,
      description: String(a.description ?? "") || undefined,
      createdAt: String(a.createdAt ?? toISO(a.createdAt ?? "")),
      updatedAt: String(a.updatedAt ?? toISO(a.updatedAt ?? "")) || undefined,
    };
  });

  const next = (get(d, ["nextCursor"]) ??
    get(d, ["data", "nextCursor"]) ??
    null) as string | null;

  return { items, nextCursor: next };
}

function pickAccountDoc(j: unknown): JournalAccountDoc {
  const d = normalize<unknown>(j);
  const fallback =
    d && (asRec(d).id || asRec(d)._id || asRec(d).name) ? d : null;
  const e = get(d, ["item"]) ?? get(d, ["data", "item"]) ?? fallback;
  if (!e) {
    throw new Error("Réponse inattendue (compte)");
  }
  const x = asRec(e);
  return {
    id: String(x.id ?? x._id ?? x.accountId ?? ""),
    name: String(x.name ?? x.accountName ?? "").trim(),
    currency: toClientCurrency(x.currency ?? "USD"),
    initial: Number(x.initial) || 0,
    description: String(x.description ?? "") || undefined,
    createdAt: String(x.createdAt ?? toISO(x.createdAt ?? "")),
    updatedAt: String(x.updatedAt ?? toISO(x.updatedAt ?? "")) || undefined,
  };
}

/* =============================================================================
 * API — journal
 * ========================================================================== */

export async function listJournal(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
  accountId?: string;
  result?: "Gain" | "Perte" | "Nul";
  dateFrom?: string;
  dateTo?: string;
}) {
  const j = await api.get("/journal", { query: params, cache: "no-store" });
  return pickJournalList(j);
}

export async function getJournal(id: string) {
  const j = await api.get(`/journal/${id}`, { cache: "no-store" });
  return pickJournalEntry(j);
}

export async function createJournal(payload: Partial<JournalDoc>) {
  const j = await api.post("/journal", payload);
  return pickIdUpdated(j);
}

export async function updateJournal(id: string, payload: Partial<JournalDoc>) {
  const j = await api.patch(`/journal/${id}`, payload);
  return pickUpdated(j);
}

export async function deleteJournal(id: string) {
  const j = await api.delete(`/journal/${id}`);
  return pickDeleted(j);
}

/* =============================================================================
 * API — marchés
 * ========================================================================== */

export async function listMarkets(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}) {
  const j = await api.get("/journal/markets", {
    query: params,
    cache: "no-store",
  });
  return pickSimpleList<MarketDoc>(j);
}

export async function getMarket(id: string) {
  const j = await api.get(`/journal/markets/${id}`, { cache: "no-store" });
  return pickSimpleDoc<MarketDoc>(j);
}

export async function createMarket(payload: { name: string }) {
  const j = await api.post("/journal/markets", payload);
  return pickIdUpdated(j);
}

export async function updateMarket(id: string, payload: { name: string }) {
  const j = await api.patch(`/journal/markets/${id}`, payload);
  return pickUpdated(j);
}

export async function deleteMarket(id: string) {
  const j = await api.delete(`/journal/markets/${id}`);
  return pickDeleted(j);
}

/* =============================================================================
 * API — stratégies
 * ========================================================================== */

export async function listStrategies(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}) {
  const j = await api.get("/journal/strategies", {
    query: params,
    cache: "no-store",
  });
  return pickSimpleList<StrategyDoc>(j);
}

export async function getStrategy(id: string) {
  const j = await api.get(`/journal/strategies/${id}`, { cache: "no-store" });
  return pickSimpleDoc<StrategyDoc>(j);
}

export async function createStrategy(payload: { name: string }) {
  const j = await api.post("/journal/strategies", payload);
  return pickIdUpdated(j);
}

export async function updateStrategy(id: string, payload: { name: string }) {
  const j = await api.patch(`/journal/strategies/${id}`, payload);
  return pickUpdated(j);
}

export async function deleteStrategy(id: string) {
  const j = await api.delete(`/journal/strategies/${id}`);
  return pickDeleted(j);
}

/* =============================================================================
 * API — comptes du journal (centralisé)
 * ========================================================================== */

export async function listJournalAccounts(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}) {
  const j = await api.get("/journal/accounts", {
    query: params,
    cache: "no-store",
  });
  return pickAccountList(j);
}

export async function getJournalAccount(id: string) {
  const j = await api.get(`/journal/accounts/${id}`, { cache: "no-store" });
  return pickAccountDoc(j);
}

export async function createJournalAccount(payload: {
  name: string;
  currency: Currency;
  initial: number;
  description?: string;
}) {
  const serverCur = toServerCurrency(payload.currency);
  const body = {
    name: payload.name,
    currency: serverCur ?? payload.currency,
    initial: payload.initial,
    description: payload.description,
  };
  const j = await api.post("/journal/accounts", body);
  return pickIdUpdated(j);
}

export async function updateJournalAccount(
  id: string,
  payload: Partial<{
    name: string;
    currency: Currency;
    initial: number;
    description?: string;
  }>
) {
  const body: UpdateJournalAccountBody = {};

  if (typeof payload.name === "string") body.name = payload.name;
  if (typeof payload.initial === "number") body.initial = payload.initial;
  if (typeof payload.description === "string")
    body.description = payload.description;

  if (payload.currency) {
    const serverCur = toServerCurrency(payload.currency);
    body.currency = serverCur ?? payload.currency;
  }

  const j = await api.patch(`/journal/accounts/${id}`, body);
  return pickUpdated(j);
}

export async function deleteJournalAccount(id: string) {
  const j = await api.delete(`/journal/accounts/${id}`);
  return pickDeleted(j);
}

export async function setAllJournalAccountsCurrency(currency: Currency) {
  const serverCur = toServerCurrency(currency) ?? currency;
  const j = await api.patch("/journal/accounts/set-currency", {
    currency: serverCur,
  });
  return normalize<{ updated: number }>(j);
}

/* =============================================================================
 * ALIAS rétrocompat
 * ========================================================================== */

export {
  listJournalAccounts as listAccountsApi,
  createJournalAccount as createAccountApi,
  updateJournalAccount as updateAccountApi,
  deleteJournalAccount as deleteAccountApi,
};
