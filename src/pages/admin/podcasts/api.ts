// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\podcasts\api.ts
import { api, ApiError } from "../../../lib/api";
import type { Podcast } from "./types";

/* ------------------ helpers de typage sûrs ------------------ */
function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

function toRecord<T extends Record<string, unknown>>(v: unknown): T {
  return (isRecord(v) ? v : {}) as T;
}

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur)) return undefined;
    cur = key in cur ? (cur as Record<string, unknown>)[key] : undefined;
  }
  return cur;
}

function asString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

function asNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toISO(d: unknown): string {
  try {
    const base =
      typeof d === "string" || typeof d === "number" || d instanceof Date
        ? d
        : Date.now();
    const dt = new Date(base);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
  } catch {
    return "";
  }
}

/** Normalise une réponse backend du style `{ ok: boolean, data?: T, error? }` */
function normalize<T>(raw: unknown): T {
  if (isRecord(raw) && "ok" in raw) {
    const ok = (raw as { ok: unknown }).ok === true;
    if (ok) {
      const data = (raw as { data?: unknown }).data;
      return (isRecord(data) ? data : ({} as unknown)) as T;
    }
    const errMsg =
      asString((raw as Record<string, unknown>).error) ??
      asString((raw as Record<string, unknown>).message) ??
      "Erreur API";
    throw new ApiError(
      400,
      String(errMsg),
      raw,
      "(podcasts-client-normalize)",
      new Headers()
    );
  }
  return raw as T;
}

// Convertit un File -> data:URL (base64)
async function fileToDataURL(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${b64}`;
}

/**
 * ⚠️ Compression client
 * - redimensionne à maxWidth (par défaut 1200px)
 * - compresse en JPEG (quality 0.75)
 * - renvoie un dataURL prêt à être envoyé au backend
 */
async function compressImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.75
): Promise<string> {
  // on lit le fichier en dataURL
  const rawDataUrl = await fileToDataURL(file);

  // sécurité SSR
  if (typeof window === "undefined" || typeof document === "undefined") {
    return rawDataUrl;
  }

  const img = new Image();
  img.src = rawDataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
  });

  const originW = img.width;
  const originH = img.height;

  // si l'image est déjà petite, on renvoie tel quel
  if (!originW || originW <= maxWidth) {
    return rawDataUrl;
  }

  const ratio = maxWidth / originW;
  const targetW = maxWidth;
  const targetH = Math.round(originH * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return rawDataUrl;
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  // JPEG compressé (tu peux passer en webp si tu veux)
  const compressed = canvas.toDataURL("image/jpeg", quality);
  return compressed;
}

/* ------------------ pickers & mapping ------------------ */
export type PodcastListItem = Podcast & {
  updatedAt?: string;
  publishedAt?: string | undefined;
};

function mapCommon(pIn: unknown): PodcastListItem {
  const p = toRecord(pIn);

  const createdByRaw = p["createdBy"] ?? p["userId"] ?? p["user"];
  const statusRaw = asString(p["status"]) ?? "brouillon";
  const languageRaw = asString(p["language"]) === "en" ? "en" : "fr";

  return {
    id: asString(p["id"]) ?? asString(p["_id"]) ?? "",
    title: asString(p["title"]) ?? "Sans titre",
    author: asString(p["author"]) ?? undefined,
    category: asString(p["category"]) ?? "Autre",
    html: asString(p["html"]) ?? "",
    coverUrl: asString(p["coverUrl"]) ?? undefined,
    audioUrl: asString(p["audioUrl"]) ?? undefined,
    duration: asNumber(p["duration"]),
    language: languageRaw as "fr" | "en",
    status: statusRaw as Podcast["status"],

    createdAt: toISO(p["createdAt"] ?? Date.now()),
    updatedAt: p["updatedAt"] ? toISO(p["updatedAt"]) : undefined,
    publishedAt: p["publishedAt"] ? toISO(p["publishedAt"]) : undefined,

    // --- audit backend ---
    userId: asString(p["userId"]) ?? asString(p["user"]) ?? undefined,
    createdById: createdByRaw !== undefined ? String(createdByRaw) : undefined,
    createdByName: asString(p["createdByName"]) ?? undefined,
    createdByEmail: asString(p["createdByEmail"]) ?? undefined,
  };
}

function pickList(j: unknown): {
  items: PodcastListItem[];
  nextCursor: string | null;
} {
  const d = normalize<unknown>(j);
  const arr =
    get(d, ["items"]) ??
    get(d, ["data", "items"]) ??
    (Array.isArray(d) ? d : []);
  const base = Array.isArray(arr) ? arr : [];
  const items: PodcastListItem[] = base.map((x) => mapCommon(x));
  const nc = get(d, ["nextCursor"]) ?? get(d, ["data", "nextCursor"]);
  const nextCursor = typeof nc === "string" ? nc : null;
  return { items, nextCursor };
}

function pickOne(j: unknown): PodcastListItem {
  const d = normalize<unknown>(j);
  const p = get(d, ["podcast"]) ?? get(d, ["data", "podcast"]) ?? d;
  return mapCommon(p);
}

function pickIdUpdated(j: unknown): { id: string; updatedAt: string } {
  const d = normalize<unknown>(j);
  const id = get(d, ["id"]) ?? get(d, ["data", "id"]);
  const updatedAt =
    get(d, ["updatedAt"]) ?? get(d, ["data", "updatedAt"]) ?? "";
  if (id === undefined || id === null) {
    throw new Error("Réponse inattendue (création podcast)");
  }
  return { id: String(id), updatedAt: String(updatedAt) };
}

function pickUpdated(j: unknown): { updatedAt: string } {
  const d = normalize<unknown>(j);
  const u = get(d, ["updatedAt"]) ?? get(d, ["data", "updatedAt"]);
  if (u == null) throw new Error("Réponse inattendue (mise à jour podcast)");
  return { updatedAt: String(u) };
}

function pickDeleted(j: unknown): { deleted: boolean } {
  const d = normalize<unknown>(j);
  const del = get(d, ["deleted"]) ?? get(d, ["data", "deleted"]);
  return { deleted: Boolean(del) };
}

/* ------------------ API ------------------ */
export type ListParams = {
  q?: string;
  status?: Podcast["status"] | "all";
  category?: string;
  language?: "fr" | "en";
  from?: string; // ISO
  to?: string; // ISO
  limit?: number;
  cursor?: string;
};

export async function listPodcasts(params?: ListParams) {
  const query = {
    ...params,
    status: params?.status === "all" ? undefined : params?.status,
  };
  const j = await api.get("/podcasts", { query, cache: "no-store" });
  return pickList(j);
}

export async function getPodcast(id: string) {
  const j = await api.get(`/podcasts/${id}`, { cache: "no-store" });
  return pickOne(j);
}

export async function createPodcast(payload: {
  title: string;
  category: string;
  author?: string;
  html?: string;
  duration?: number;
  language?: "fr" | "en";
  fileCover?: File;
  fileAudio?: File;
}) {
  const body: Record<string, unknown> = {
    title: payload.title,
    category: payload.category,
    author: payload.author,
    html: payload.html,
    duration: payload.duration,
    language: payload.language ?? "fr",
  };

  // ✅ compression côté client AVANT envoi
  if (payload.fileCover) {
    body.coverDataURL = await compressImageFile(payload.fileCover, 1200, 0.75);
  }

  if (payload.fileAudio) {
    body.audioDataURL = await fileToDataURL(payload.fileAudio);
  }

  const j = await api.post("/podcasts", body);
  return pickIdUpdated(j);
}

export async function updatePodcast(
  id: string,
  payload: {
    title?: string;
    category?: string;
    author?: string;
    html?: string;
    duration?: number;
    status?: Podcast["status"];
    language?: "fr" | "en";
    fileCover?: File;
    fileAudio?: File;
    coverUrl?: string;
    audioUrl?: string;
  }
) {
  const body: Record<string, unknown> = { ...payload };

  // ✅ si on remet une nouvelle cover, on compresse
  if (payload.fileCover) {
    body.coverDataURL = await compressImageFile(payload.fileCover, 1200, 0.75);
    delete body.fileCover;
  }

  if (payload.fileAudio) {
    body.audioDataURL = await fileToDataURL(payload.fileAudio);
    delete body.fileAudio;
  }

  const j = await api.patch(`/podcasts/${id}`, body);
  return pickUpdated(j);
}

export async function togglePublish(id: string) {
  const j = await api.post(`/podcasts/${id}/toggle`, {});
  const d = normalize<unknown>(j);
  return {
    updatedAt: String(
      get(d, ["updatedAt"]) ?? get(d, ["data", "updatedAt"]) ?? ""
    ),
    status: String(
      get(d, ["status"]) ?? get(d, ["data", "status"]) ?? "brouillon"
    ) as Podcast["status"],
    publishedAt: (get(d, ["publishedAt"]) ??
      get(d, ["data", "publishedAt"]) ??
      null) as string | null,
  };
}

export async function deletePodcast(id: string) {
  const j = await api.delete(`/podcasts/${id}`);
  return pickDeleted(j);
}
