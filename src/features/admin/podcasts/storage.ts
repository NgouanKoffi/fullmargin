import { LS_KEY } from "./constants";
import type { Podcast } from "./types";

/** Lecture sûre depuis LocalStorage */
export function loadAll(): Podcast[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as Podcast[];
  } catch {
    return [];
  }
}

/** Écriture. Retourne true si OK, false si quota/erreur. */
export function saveAll(list: Podcast[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("LocalStorage save failed:", e);
    return false;
  }
}

/** Purge */
export function clearAll() {
  localStorage.removeItem(LS_KEY);
}
