// src/pages/communaute/private/community-details/tabs/Formations/formations.media.ts
import type { CurriculumItem, Lesson, Module } from "./types";

/* ====== Sérialisation / revival de File ====== */
export type SerializedFile = {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
};

export async function fileToDataUrl(f: File): Promise<string> {
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = () => res(String(r.result));
    r.readAsDataURL(f);
  });
}

export async function serializeFile(f: File): Promise<SerializedFile> {
  return {
    name: f.name,
    type: f.type ?? "application/octet-stream",
    lastModified: f.lastModified ?? Date.now(),
    dataUrl: await fileToDataUrl(f),
  };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime =
    meta.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

export function reviveFile(sf: SerializedFile | null | undefined): File | null {
  if (!sf) return null;
  const blob = dataUrlToBlob(sf.dataUrl);
  return new File([blob], sf.name, {
    type: sf.type,
    lastModified: sf.lastModified,
  });
}

/* ====== Utils type-safe ====== */

export type CI = CurriculumItem & {
  filename?: string | null;
  __serializedFile?: SerializedFile | null;
  file?: File | null;
  url?: string | null;
  durationMin?: number | undefined;
  subtype?: string | null;
};

/**
 * Helper robuste pour savoir si une valeur est vraiment un File
 * (évite les soucis avec instanceof dans certains environnements)
 */
const hasFileCtor = () => {
  try {
    return typeof File !== "undefined";
  } catch {
    return false;
  }
};

export function isRealFile(x: unknown): x is File {
  if (!x || typeof x !== "object") return false;

  if (hasFileCtor() && x instanceof File) return true;

  const o = x as Partial<File> & { name?: unknown; lastModified?: unknown };
  return typeof o.name === "string" && typeof o.lastModified === "number";
}

/**
 * ✅ Version simplifiée :
 * On considère qu'il y a un média si :
 * - file non nul
 * - OU un miroir base64
 * - OU une URL non vide
 * - OU un filename non vide
 */
export function itemHasMedia(it: Partial<CI>): boolean {
  const hasFile = !!it.file;
  const hasMirror = !!it.__serializedFile?.dataUrl;
  const hasUrl = typeof it.url === "string" && it.url.trim().length > 0;
  const hasName =
    typeof it.filename === "string" && it.filename.trim().length > 0;

  return hasFile || hasMirror || hasUrl || hasName;
}

export function stripItemToMinimal(it: CI) {
  return {
    id: it.id,
    type: it.type,
    subtype: it.subtype ?? undefined,
    title: (it.title || "").trim(),
    url: it.url ?? undefined,
    filename: it.filename ?? undefined,
    durationMin: it.durationMin ?? undefined,
  };
}

/* ====== Merge « préserve médias » ====== */
export function mergeItemsPreserveMedia(base: CI[], patch: CI[]): CI[] {
  const byId = new Map<string, CI>(base.map((b) => [b.id, b]));
  return patch.map((pi) => {
    const old = byId.get(pi.id);
    if (!old) return pi;
    const merged: CI = { ...old, ...pi };

    if (pi.file === undefined) merged.file = old.file ?? null;
    if (pi.__serializedFile === undefined)
      merged.__serializedFile = old.__serializedFile ?? null;
    if (pi.url === undefined) merged.url = old.url ?? null;
    if (pi.filename === undefined) merged.filename = old.filename ?? null;
    if (pi.durationMin === undefined) merged.durationMin = old.durationMin;

    return merged;
  });
}

export function mergeLessonsPreserveMedia(
  base: Lesson[],
  patch: Lesson[]
): Lesson[] {
  const byId = new Map<string, Lesson>(base.map((b) => [b.id, b]));
  return patch.map((pl) => {
    const old = byId.get(pl.id);
    if (!old) return pl;
    return {
      ...old,
      ...pl,
      items: mergeItemsPreserveMedia(
        (old.items as unknown as CI[]) ?? [],
        (pl.items as unknown as CI[]) ?? []
      ) as unknown as CurriculumItem[],
    };
  });
}

export function mergeModulesPreserveMedia(
  base: Module[],
  patch: Module[]
): Module[] {
  const byId = new Map<string, Module>(base.map((b) => [b.id, b]));
  return patch.map((pm) => {
    const old = byId.get(pm.id);
    if (!old) return pm;
    return {
      ...old,
      ...pm,
      lessons: mergeLessonsPreserveMedia(old.lessons ?? [], pm.lessons ?? []),
    };
  });
}
