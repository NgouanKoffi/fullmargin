// src/pages/communaute/private/community-details/tabs/Formations/steps/Step2Curriculum/helpers.ts
import type { CurriculumItem } from "../../types";

/** Limite au-delà de laquelle on NE fait plus de base64 (évite Out Of Memory) */
export const MAX_PREVIEW_BYTES = 20 * 1024 * 1024; // ~20 Mo

export const uid = () => Math.random().toString(36).slice(2, 9);

export type SerializedFile = {
  dataUrl: string;
  name?: string;
  type?: string;
  lastModified?: number;
};

/** Item enrichi pour l'UI (fichiers, miroirs, etc.) */
export type UIItem = CurriculumItem & {
  file?: File | null;
  filename?: string | null;
  __serializedFile?: SerializedFile | null;
  url?: string | null;
  durationMin?: number;
  /** Type de ressource côté UI */
  subtype?: "video" | "doc" | "link" | "image";
};

/** Extraire un nom “lisible” depuis une URL (dernier segment décodé, sans query/hash) */
export function nameFromUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(last || raw);
  } catch {
    // URL relative ou chaîne brute
    const noHash = raw.split("#")[0];
    const noQuery = noHash.split("?")[0];
    const last = noQuery.split("/").filter(Boolean).pop() || "";
    return last || raw;
  }
}

/** ✅ Nom à afficher en priorité (file > filename > miroir) */
export function displaySelectedName(it: Partial<UIItem>): string | null {
  // 1) Fichier en mémoire
  if (it.file && typeof (it.file as File).name === "string") {
    return (it.file as File).name;
  }

  // 2) filename stocké
  if (it.filename && it.filename.trim()) {
    return it.filename.trim();
  }

  // 3) nom depuis le miroir base64 si présent
  if (it.__serializedFile?.name && it.__serializedFile.name.trim()) {
    return it.__serializedFile.name.trim();
  }

  return null;
}

/** Nom “actuel” depuis l’URL distante (si rien n’a été sélectionné localement) */
export function displayCurrentName(it: Partial<UIItem>): string | null {
  return nameFromUrl(it?.url ?? null);
}

/** Durée vidéo (secondes) */
export function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const secs = video.duration;
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(secs) ? secs : 0);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Durée vidéo indisponible"));
      };

      video.src = url;
    } catch (e) {
      reject(e);
    }
  });
}
