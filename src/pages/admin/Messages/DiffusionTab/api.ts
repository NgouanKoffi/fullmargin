// src/pages/admin/Messages/DiffusionTab/api.ts
import { loadSession } from "../../../../auth/lib/storage";
import type { DiffusionGroup } from "./types";

const API_BASE = "/api/admin/diffusions";
const API_USERS = "/api/admin/users";
const API_USERS_ALL = "/api/admin/users/all-emails";

/* --------------------------- helpers & types sûrs --------------------------- */

type JsonObject = Record<string, unknown>;

function authHeaders() {
  const sess = loadSession?.();
  const token = sess?.token;
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Extrait une chaîne sûre depuis une propriété potentiellement inconnue */
function getString(o: unknown, key: string): string | undefined {
  if (!o || typeof o !== "object") return undefined;
  const v = (o as JsonObject)[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Normalise un objet venu du backend vers un DiffusionGroup en garantissant `id` */
function normalizeGroup(input: unknown): DiffusionGroup {
  const obj = (
    input && typeof input === "object" ? (input as JsonObject) : {}
  ) as JsonObject;
  const id = getString(obj, "id") ?? getString(obj, "_id") ?? "";
  // On fusionne le reste en supposant la compat DiffusionGroup (côté appelant).
  // Ici on évite any en castant via unknown -> DiffusionGroup, après avoir forcé id: string.
  return { ...(obj as unknown as Omit<DiffusionGroup, "id">), id };
}

/** Lit un tableau d’objets et normalise en DiffusionGroup[] */
function normalizeGroups(items: unknown[]): DiffusionGroup[] {
  return (items ?? []).map(normalizeGroup);
}

/** Extrait un tableau d’emails depuis une réponse inconnue de /users */
function extractEmails(users: unknown[]): string[] {
  return (users ?? []).map((u) => getString(u, "email") ?? "").filter(Boolean);
}

/* --------------------------------- API ---------------------------------- */

/* ---------- Diffusions ---------- */
export async function listGroups(params?: {
  q?: string;
  limit?: number;
  offset?: number;
  mine?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set("q", params.q);
  if (typeof params?.limit === "number") q.set("limit", String(params.limit));
  if (typeof params?.offset === "number")
    q.set("offset", String(params.offset));
  if (params?.mine === false) q.set("mine", "0");

  const data = await getJSON<{
    items: unknown[];
    total: number;
    offset: number;
    limit: number;
  }>(`${API_BASE}?${q.toString()}`);

  const items = normalizeGroups(data.items);
  return { ...data, items };
}

export async function getGroup(id: string, mine = true) {
  const url = `${API_BASE}/${encodeURIComponent(id)}${mine ? "" : "?mine=0"}`;
  const data = await getJSON<{ group: unknown }>(url);
  return normalizeGroup(data.group);
}

export async function createGroup(
  payload: Partial<DiffusionGroup> & { snapshot?: boolean }
) {
  const data = await getJSON<{ ok: boolean; group: unknown }>(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeGroup(data.group);
}

export async function updateGroup(
  id: string,
  payload: Partial<DiffusionGroup> & { snapshot?: boolean }
) {
  const data = await getJSON<{ ok: boolean; group: unknown }>(
    `${API_BASE}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return normalizeGroup(data.group);
}

export async function deleteGroup(id: string) {
  await getJSON<unknown>(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function snapshotGroup(id: string, mine = true) {
  const url = `${API_BASE}/${encodeURIComponent(id)}/snapshot${
    mine ? "" : "?mine=0"
  }`;
  const data = await getJSON<{ ok: boolean; group: unknown }>(url, {
    method: "POST",
  });
  return normalizeGroup(data.group);
}

export async function fetchRecipients(params: {
  id: string;
  useSnapshot?: boolean;
  limit?: number;
  offset?: number;
  mine?: boolean;
}) {
  const q = new URLSearchParams();
  if (params.useSnapshot) q.set("useSnapshot", "1");
  if (typeof params.limit === "number") q.set("limit", String(params.limit));
  if (typeof params.offset === "number") q.set("offset", String(params.offset));
  if (params.mine === false) q.set("mine", "0");

  return getJSON<{
    items: string[];
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  }>(`${API_BASE}/${encodeURIComponent(params.id)}/recipients?${q.toString()}`);
}

/* ---------- Users (suggestions) ---------- */
export async function searchUsers(q: string, limit = 8) {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  const data = await getJSON<{ users: unknown[] }>(
    `${API_USERS}?${qs.toString()}`
  );
  return extractEmails(data.users);
}

/**
 * Liste tous les emails en base via /admin/users/all-emails,
 * puis tronque côté front à `limit` si besoin.
 */
export async function listUsersAll(limit = 200) {
  const data = await getJSON<{
    totalUsers?: number;
    emails?: string[];
  }>(API_USERS_ALL);

  const emails = Array.isArray(data.emails) ? data.emails : [];
  return emails.slice(0, limit);
}
