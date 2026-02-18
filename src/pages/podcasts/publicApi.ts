// src/pages/podcasts/publicApi.ts
import { api, ApiError } from "../../lib/api";
import type { Podcast } from "./types";

/* ============================ */
/*            Types             */
/* ============================ */

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: unknown;
  message?: unknown;
};

type PublicListWireItem = {
  id?: unknown;
  _id?: unknown;
  title?: unknown;
  artist?: unknown;
  author?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  durationSec?: unknown;
  duration?: unknown;
  description?: unknown;
  html?: unknown;
  audioUrl?: unknown;
  streamUrl?: unknown;
  category?: unknown;
  publishedAt?: unknown;
  language?: unknown;

  likesCount?: unknown;
  dislikesCount?: unknown;
  viewsCount?: unknown;
  savesCount?: unknown;

  isNew?: unknown;
};

type PublicListWire = {
  items?: unknown;
  nextCursor?: unknown;
};

export type PublicPodcast = Podcast &
  Partial<{
    audioUrl: string;
    streamUrl: string;
    category: string;
    publishedAt: string;
    html: string;
  }> & {
    id: string;
    title: string;
    artist: string;
    cover: string;
    durationSec: number;
    description: string;
    language: "fr" | "en";
    likesCount?: number;
    dislikesCount?: number;
    viewsCount?: number;
    savesCount?: number;
    isNew?: boolean;
  };

export type PublicListResult = {
  items: PublicPodcast[];
  nextCursor: string | null;
};

export type PublicListParams = {
  q?: string;
  category?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
  language?: "fr" | "en";
};

/* ============================ */
/*          Utils safe          */
/* ============================ */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function get(obj: unknown, path: readonly (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[String(k)];
  }
  return cur;
}

function toISO(d: unknown): string | undefined {
  if (typeof d === "string" || typeof d === "number" || d instanceof Date) {
    try {
      const iso = new Date(d).toISOString();
      return iso;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toLang(v: unknown): "fr" | "en" {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return s === "en" ? "en" : "fr";
}

function transformCloudinary(src?: string, width = 600): string {
  if (!src) return "";
  if (!src.includes("/upload/")) return src;
  return src.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

function normalize<T>(raw: unknown): T {
  if (isRecord(raw) && "ok" in raw) {
    const env = raw as ApiEnvelope<unknown>;
    if (env.ok === true) {
      return (env.data ?? ({} as unknown)) as T;
    }
    const msg = String(env.error ?? env.message ?? "Erreur API");
    throw new ApiError(
      400,
      msg,
      raw as Record<string, unknown>,
      "(public-podcasts-normalize)",
      new Headers()
    );
  }
  return raw as T;
}

/* ============================ */
/*         Pickers (typed)      */
/* ============================ */

function mapWireItemToPublic(p: PublicListWireItem): PublicPodcast {
  const id = String(p.id ?? p._id ?? "");
  const title = String(p.title ?? "Sans titre");
  const artist = String(
    (p as Record<string, unknown>).artist ?? p.author ?? "Anonyme"
  );

  const rawCover = String(p.cover ?? p.coverUrl ?? "");
  const cover = transformCloudinary(rawCover, 600);

  const durationSec = toNum(p.durationSec ?? p.duration);
  const description = String(p.description ?? "");

  const html = p.html != null ? String(p.html) : undefined;
  const audioUrl = p.audioUrl != null ? String(p.audioUrl) : undefined;
  const streamUrl = p.streamUrl != null ? String(p.streamUrl) : undefined;
  const category = p.category != null ? String(p.category) : undefined;
  const publishedAt = toISO(p.publishedAt);
  const language = toLang(p.language);

  const likesCount = toNum(p.likesCount);
  const dislikesCount = toNum(p.dislikesCount);
  const viewsCount = toNum(p.viewsCount);
  const savesCount = toNum(p.savesCount);

  const isNew =
    typeof p.isNew === "boolean"
      ? p.isNew
      : String(p.isNew ?? "") === "true"
      ? true
      : false;

  return {
    id,
    title,
    artist,
    cover,
    durationSec,
    description,
    audioUrl,
    streamUrl,
    category,
    publishedAt,
    html,
    language,
    likesCount,
    dislikesCount,
    viewsCount,
    savesCount,
    isNew,
  } as PublicPodcast;
}

export function pickList(j: unknown): PublicListResult {
  const n = normalize<unknown>(j);

  const dataSection: PublicListWire = ((): PublicListWire => {
    if (isRecord(n) && isRecord((n as Record<string, unknown>).data)) {
      return (n as { data: PublicListWire }).data;
    }
    return (isRecord(n) ? (n as PublicListWire) : {}) as PublicListWire;
  })();

  const arrUnknown = get(dataSection, ["items"]);
  const arr = Array.isArray(arrUnknown)
    ? (arrUnknown as PublicListWireItem[])
    : [];

  const items = arr.map(mapWireItemToPublic);

  const ncUnknown = get(dataSection, ["nextCursor"]);
  const nextCursor =
    typeof ncUnknown === "string" || ncUnknown === null
      ? (ncUnknown as string | null)
      : ncUnknown == null
      ? null
      : String(ncUnknown);

  return { items, nextCursor };
}

export function pickOne(j: unknown): PublicPodcast {
  const n = normalize<unknown>(j);

  const candidate = ((): unknown => {
    if (isRecord(n) && isRecord((n as Record<string, unknown>).data)) {
      const d = (n as { data: unknown }).data;
      if (isRecord(d) && "podcast" in d)
        return (d as { podcast: unknown }).podcast;
    }
    if (isRecord(n) && "podcast" in n)
      return (n as { podcast: unknown }).podcast;
    return n;
  })();

  const p = isRecord(candidate)
    ? (candidate as PublicListWireItem)
    : ({} as PublicListWireItem);
  return mapWireItemToPublic(p);
}

/* ============================ */
/*             API              */
/* ============================ */

export async function listPublicPodcasts(
  params?: PublicListParams
): Promise<PublicListResult> {
  const query = { limit: 60, ...(params || {}) };
  const j = await api.get("/public/podcasts", {
    query,
    cache: "no-store",
  });
  return pickList(j);
}

export async function getPublicPodcast(id: string): Promise<PublicPodcast> {
  const j = await api.get(`/public/podcasts/${id}`, {
    cache: "no-store",
  });
  return pickOne(j);
}

export async function viewPublicPodcast(id: string): Promise<number> {
  const data = normalize<{ viewsCount: number }>(
    await api.post(
      `/public/podcasts/${id}/view`,
      {},
      {
        // plus de header custom
      }
    )
  );
  return data.viewsCount ?? 0;
}

export async function reactPublicPodcast(
  id: string,
  type: "like" | "dislike",
  action: "set" | "unset"
): Promise<{ likesCount: number; dislikesCount: number }> {
  const data = normalize<{ likesCount: number; dislikesCount: number }>(
    await api.post(
      `/public/podcasts/${id}/react`,
      { type, action },
      {
        // pas de x-fm-fp
      }
    )
  );
  return data;
}

export async function savePublicPodcast(
  id: string,
  action: "set" | "unset"
): Promise<{ savesCount: number }> {
  const data = normalize<{ savesCount: number }>(
    await api.post(
      `/public/podcasts/${id}/save`,
      { action },
      {
        // pas de x-fm-fp
      }
    )
  );
  return data;
}

export async function getPublicPodcastNewCount(params?: {
  category?: string;
  language?: "fr" | "en";
}): Promise<number> {
  const j = await api.get("/public/podcasts/__meta/new-count", {
    query: params || {},
    cache: "no-store",
  });
  const d = normalize<{ count: number }>(j);
  return d.count ?? 0;
}

export async function getPublicPodcastNewCounts(params: {
  categories: string[];
  language?: "fr" | "en";
}): Promise<Record<string, number>> {
  const query: Record<string, string> = {
    categories: params.categories.map(encodeURIComponent).join(","),
  };
  if (params.language) query.language = params.language;

  const j = await api.get("/public/podcasts/__meta/new-counts", {
    query,
    cache: "no-store",
  });
  const d = normalize<{ counts: Record<string, number> }>(j);
  return d.counts ?? {};
}

export async function getPublicPlaylistIds(): Promise<string[]> {
  try {
    const j = await api.get("/public/podcasts/playlist", {
      cache: "no-store",
    });
    const n = normalize<{ items?: unknown }>(j);
    if (Array.isArray(n.items)) {
      return n.items.map((x) => String(x));
    }
    return [];
  } catch {
    return [];
  }
}

export async function addPublicPlaylistItem(id: string): Promise<void> {
  await api.post(
    "/public/podcasts/playlist",
    { id },
    {
      // pas de header custom
    }
  );
}

export async function removePublicPlaylistItem(id: string): Promise<void> {
  await api.delete(`/public/podcasts/playlist/${id}`, {
    // pas de header custom
  });
}
