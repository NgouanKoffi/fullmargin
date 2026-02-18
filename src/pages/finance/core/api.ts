// src/pages/finance/core/api.ts
import { api, ApiError } from "../../../lib/api";
import type {
  Account,
  Transaction,
  TxType,
  Recurrence,
  TxDetail,
  Currency,
} from "./types";

/* ---------- utils tolérants de formes JSON ---------- */
type JsonRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is JsonRecord =>
  typeof v === "object" && v !== null;

function getPath(obj: unknown, path: readonly string[]): unknown {
  if (!isRecord(obj)) return undefined;
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur) || !(key in cur)) return undefined;
    cur = (cur as JsonRecord)[key];
  }
  return cur;
}

type OkWrapper = {
  ok: boolean;
  data?: unknown;
  error?: unknown;
  message?: unknown;
};

function normalize<T = unknown>(raw: unknown): T {
  if (isRecord(raw) && "ok" in raw) {
    const w = raw as OkWrapper;
    if (w.ok === true) return (w.data ?? {}) as T;
    const msg = String(w.error ?? w.message ?? "Erreur API");
    throw new ApiError(
      400,
      msg,
      raw,
      "(finance-client-normalize)",
      new Headers()
    );
  }
  return raw as T;
}

function pickId(obj: unknown): string | undefined {
  const v =
    getPath(obj, ["id"]) ??
    getPath(obj, ["_id"]) ??
    getPath(obj, ["data", "id"]);
  if (typeof v === "string" || typeof v === "number") return String(v);
  return undefined;
}

function toISO(d: unknown): string {
  try {
    const value =
      typeof d === "number" || typeof d === "string" || d instanceof Date
        ? d
        : Date.now();
    return new Date(value).toISOString();
  } catch {
    return "";
  }
}

const toStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;

const toNum = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : fallback;

/* ======================= PREFS (NOUVEAU) ======================= */
export async function getPrefs(): Promise<{ globalCurrency: Currency }> {
  const j = await api.get("/finance/prefs", { cache: "no-store" });
  const d = normalize(j);
  const gc =
    (getPath(d, ["globalCurrency"]) as Currency | undefined) ??
    (getPath(d, ["prefs", "globalCurrency"]) as Currency | undefined) ??
    ("XOF" as Currency);
  return { globalCurrency: gc };
}

export async function updatePrefs(payload: {
  globalCurrency?: Currency;
}): Promise<{ updated: boolean }> {
  // on envoie juste, on ne lit pas la réponse
  await api.patch("/finance/prefs", payload);
  return { updated: true };
}

/* ======================= ACCOUNTS ======================= */
export type AccountListItem = Account & { updatedAt?: string };

function readAccountListItem(a: unknown): AccountListItem {
  const id = String(pickId(a) ?? "");
  const name = toStr(getPath(a, ["name"]), "Sans nom");
  const currency =
    (toStr(getPath(a, ["currency"]), "XOF") as Currency) || ("XOF" as Currency);
  const initial = toNum(getPath(a, ["initial"]), 0);
  const descriptionRaw = getPath(a, ["description"]);
  const description =
    typeof descriptionRaw === "string"
      ? descriptionRaw
      : descriptionRaw != null
      ? String(descriptionRaw)
      : "";
  const createdAt = toISO(getPath(a, ["createdAt"]) ?? Date.now());
  const u = getPath(a, ["updatedAt"]);
  const updatedAt = u == null ? undefined : toISO(u);
  return { id, name, currency, initial, description, createdAt, updatedAt };
}

function pickAccountsList(j: unknown): {
  items: AccountListItem[];
  nextCursor: string | null;
} {
  const d = normalize(j);
  let arrUnknown = getPath(d, ["items"]);
  if (!Array.isArray(arrUnknown)) arrUnknown = getPath(d, ["data", "items"]);
  const arr = Array.isArray(arrUnknown)
    ? arrUnknown
    : Array.isArray(d)
    ? (d as unknown[])
    : [];

  const items: AccountListItem[] = arr.map((a) => readAccountListItem(a));

  const nc =
    getPath(d, ["nextCursor"]) ?? getPath(d, ["data", "nextCursor"]) ?? null;
  const nextCursor =
    typeof nc === "string" && nc.length > 0 ? nc : (nc as null);
  return { items, nextCursor };
}

function pickAccountOne(j: unknown): AccountListItem {
  const d = normalize(j);
  const a = getPath(d, ["account"]) ?? getPath(d, ["data", "account"]) ?? d;
  return readAccountListItem(a);
}

function pickIdUpdated(j: unknown): { id: string; updatedAt: string } {
  const d = normalize(j);
  const id = pickId(d) ?? (toStr(getPath(d, ["data", "id"])) || undefined);
  const u =
    getPath(d, ["updatedAt"]) ?? getPath(d, ["data", "updatedAt"]) ?? "";
  if (!id) throw new Error("Réponse inattendue (création compte)");
  return { id: String(id), updatedAt: String(u) };
}

function pickUpdated(j: unknown): { updatedAt: string } {
  const d = normalize(j);
  const u = getPath(d, ["updatedAt"]) ?? getPath(d, ["data", "updatedAt"]);
  if (u == null) throw new Error("Réponse inattendue (mise à jour compte)");
  return { updatedAt: String(u) };
}

function pickDeleted(j: unknown): { deleted: boolean } {
  const d = normalize(j);
  const del = getPath(d, ["deleted"]) ?? getPath(d, ["data", "deleted"]);
  return { deleted: !!del };
}

/** Accounts — API */
export async function listAccounts(params?: {
  q?: string;
  limit?: number;
  cursor?: string;
}) {
  const j = await api.get("/finance/accounts", {
    query: params,
    cache: "no-store",
  });
  return pickAccountsList(j);
}
export async function getAccount(id: string) {
  const j = await api.get(`/finance/accounts/${id}`, { cache: "no-store" });
  return pickAccountOne(j);
}
export async function createAccount(payload: {
  name: string;
  currency: Currency;
  initial?: number;
  description?: string;
}) {
  const j = await api.post("/finance/accounts", payload);
  return pickIdUpdated(j);
}
export async function updateAccount(
  id: string,
  payload: Partial<
    Pick<Account, "name" | "currency" | "initial" | "description">
  >
) {
  const j = await api.patch(`/finance/accounts/${id}`, payload);
  return pickUpdated(j);
}
export async function deleteAccount(id: string) {
  const j = await api.delete(`/finance/accounts/${id}`);
  return pickDeleted(j);
}

/* ======================= TRANSACTIONS ======================= */
export type TxListItem = Transaction & { updatedAt?: string };

function readTxListItem(t: unknown): TxListItem {
  const id = String(pickId(t) ?? "");
  const accountId = toStr(
    getPath(t, ["accountId"]) ?? getPath(t, ["account"]),
    ""
  );
  const type =
    (toStr(getPath(t, ["type"]), "expense") as TxType) || ("expense" as TxType);
  const amount = toNum(getPath(t, ["amount"]), 0);
  const date = toISO(getPath(t, ["date"]) ?? Date.now());
  const recurrence =
    (toStr(getPath(t, ["recurrence"]), "fixe") as Recurrence) ||
    ("fixe" as Recurrence);
  const detail =
    (toStr(getPath(t, ["detail"]), "autre") as TxDetail) ||
    ("autre" as TxDetail);
  const commentRaw = getPath(t, ["comment"]);
  const comment =
    typeof commentRaw === "string"
      ? commentRaw
      : commentRaw != null
      ? String(commentRaw)
      : "";
  const createdAt = toISO(getPath(t, ["createdAt"]) ?? Date.now());
  const parentIdRaw = getPath(t, ["parentId"]);
  const parentId =
    typeof parentIdRaw === "string"
      ? parentIdRaw
      : typeof parentIdRaw === "number"
      ? String(parentIdRaw)
      : undefined;
  const updatedAtRaw = getPath(t, ["updatedAt"]);
  const updatedAt = updatedAtRaw == null ? undefined : toISO(updatedAtRaw);
  return {
    id,
    accountId,
    type,
    amount,
    date,
    recurrence,
    detail,
    comment,
    createdAt,
    parentId,
    updatedAt,
  };
}

function pickTxList(j: unknown): {
  items: TxListItem[];
  nextCursor: string | null;
} {
  const d = normalize(j);
  let arrUnknown = getPath(d, ["items"]);
  if (!Array.isArray(arrUnknown)) arrUnknown = getPath(d, ["data", "items"]);
  const arr = Array.isArray(arrUnknown)
    ? arrUnknown
    : Array.isArray(d)
    ? (d as unknown[])
    : [];

  const items: TxListItem[] = arr.map((t) => readTxListItem(t));

  const nc =
    getPath(d, ["nextCursor"]) ?? getPath(d, ["data", "nextCursor"]) ?? null;
  const nextCursor =
    typeof nc === "string" && nc.length > 0 ? nc : (nc as null);
  return { items, nextCursor };
}

function pickTxOne(j: unknown): TxListItem {
  const d = normalize(j);
  const t =
    getPath(d, ["transaction"]) ?? getPath(d, ["data", "transaction"]) ?? d;
  return readTxListItem(t);
}

function pickTxIdUpdated(j: unknown): { id: string; updatedAt: string } {
  const d = normalize(j);
  const id = pickId(d) ?? (toStr(getPath(d, ["data", "id"])) || undefined);
  const u =
    getPath(d, ["updatedAt"]) ?? getPath(d, ["data", "updatedAt"]) ?? "";
  if (!id) throw new Error("Réponse inattendue (création transaction)");
  return { id: String(id), updatedAt: String(u) };
}

/** Transactions — API */
export type ListTxParams = {
  q?: string;
  accountId?: string;
  type?: TxType;
  detail?: TxDetail;
  recurrence?: Recurrence;
  from?: string; // ISO date (inclus)
  to?: string; // ISO date (inclus)
  limit?: number;
  cursor?: string; // pagination (cursor = updatedAt)
};
export async function listTransactions(params?: ListTxParams) {
  const j = await api.get("/finance/transactions", {
    query: params,
    cache: "no-store",
  });
  return pickTxList(j);
}
export async function getTransaction(id: string) {
  const j = await api.get(`/finance/transactions/${id}`, { cache: "no-store" });
  return pickTxOne(j);
}
export async function createTransaction(payload: {
  accountId: string;
  type: TxType;
  amount: number;
  date: string;
  recurrence: Recurrence;
  detail: TxDetail;
  comment?: string;
  parentId?: string;
}) {
  const j = await api.post("/finance/transactions", payload);
  return pickTxIdUpdated(j);
}
export async function updateTransaction(
  id: string,
  payload: Partial<
    Pick<
      Transaction,
      | "accountId"
      | "type"
      | "amount"
      | "date"
      | "recurrence"
      | "detail"
      | "comment"
    >
  >
) {
  const j = await api.patch(`/finance/transactions/${id}`, payload);
  const d = normalize(j);
  const u =
    (getPath(d, ["updatedAt"]) as string | undefined) ??
    (getPath(d, ["data", "updatedAt"]) as string | undefined) ??
    new Date().toISOString();
  return { updatedAt: u };
}
export async function deleteTransaction(id: string) {
  await api.delete(`/finance/transactions/${id}`);
  return { deleted: true };
}
