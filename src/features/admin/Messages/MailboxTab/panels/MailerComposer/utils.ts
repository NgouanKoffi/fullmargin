// src/pages/admin/Messages/MailboxTab/panels/MailerComposer/utils.ts

import { api } from "@core/api/client";

/* ---------------- Files helpers ---------------- */
export type AttachmentKind = "image" | "pdf" | "doc" | "sheet" | "other";

export function kindFor(f: File): AttachmentKind {
  if (f.type.startsWith("image/")) return "image";
  if (f.type === "application/pdf") return "pdf";
  if (f.type.includes("sheet") || f.type.includes("excel")) return "sheet";
  if (f.type.includes("word")) return "doc";
  return "other";
}

/* ---------------- fetch helpers (via client api) ---------------- */

/**
 * GET/JSON helper. Si `init.method` est fourni, il est respecté
 * (utile pour PATCH/DELETE sans payload JSON).
 */
export async function fetchJSON<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  return api<T>(path, { ...init, method });
}

export async function postJSON<T = unknown>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  return api.post<T>(path, body, init);
}

export async function patchJSON<T = unknown>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  return api.patch<T>(path, body, init);
}

export async function deleteJSON<T = unknown>(
  path: string,
  body?: unknown,
  init: RequestInit = {}
): Promise<T> {
  if (body !== undefined) {
    // DELETE avec payload JSON
    return api<T>(path, { ...init, method: "DELETE", json: body });
  }
  return api.delete<T>(path, init);
}

/** Upload (FormData) — Bearer automatique, pas de Content-Type forcé. */
export async function uploadWithAuth<T = unknown>(
  path: string,
  form: FormData,
  init: RequestInit = {}
): Promise<T> {
  return api<T>(path, { ...init, method: "POST", body: form });
}

/* ---------------- Email utils ---------------- */
export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

/** Extrait plusieurs emails d’un texte/paste (gère “Nom <mail@x>”, virgules, retours, etc.) */
export function parseManyEmails(input: string): string[] {
  if (!input) return [];
  const hits = String(input).match(EMAIL_RE) || [];
  return hits.map((e) => e.trim());
}

/** Déduplique en lower-case en préservant l’ordre d’apparition */
export function uniqEmails(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const e = raw.toLowerCase();
    if (!seen.has(e)) {
      seen.add(e);
      out.push(raw);
    }
  }
  return out;
}
