// C:\Users\ADMIN\Desktop\fullmargin-site\src\auth\lib\storage.ts
import type { Session } from "../types";
import { INACTIVITY_MS } from "../AuthContext/inactivity";

export const SESSION_KEY = "fm:session";

// ✅ TTL de secours si le backend n'a pas mis d'expiration
// → on utilise la même valeur que l'inactivité (désormais 7 jours)
const FALLBACK_TTL_MS = INACTIVITY_MS;

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session | null;
    if (!parsed) return null;

    // 🟣 normaliser expiresAt
    const now = Date.now();
    let expiresAt = parsed.expiresAt as number | string | undefined;

    if (typeof expiresAt === "string") {
      const n = Number(expiresAt);
      expiresAt = Number.isFinite(n) ? n : undefined;
    }

    if (typeof expiresAt === "number") {
      // cas classique d’erreur: expiresAt en secondes
      if (expiresAt < 10 ** 12) {
        // 10**12 ≈ 2001-09-09 en ms, donc en dessous c’est sûrement des secondes
        expiresAt = expiresAt * 1000;
      }
    }

    // si toujours pas d’expiration → on met le fallback (7j)
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
      expiresAt = now + FALLBACK_TTL_MS;
    }

    // session expirée
    if (expiresAt <= now) return null;

    // on réécrit dans le storage si on a corrigé / normalisé
    const fixed: Session = { ...parsed, expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(fixed));

    return fixed;
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("loadSession failed:", err);
    }
    return null;
  }
}

export function saveSession(s: Session | null): void {
  try {
    if (!s) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    // on applique la même normalisation à l’enregistrement
    let expiresAt = s.expiresAt as number | string | undefined;

    if (typeof expiresAt === "string") {
      const n = Number(expiresAt);
      expiresAt = Number.isFinite(n) ? n : undefined;
    }

    if (typeof expiresAt === "number" && expiresAt < 10 ** 12) {
      // secondes -> ms
      expiresAt = expiresAt * 1000;
    }

    // si pas d’expiration => fallback 7j
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
      expiresAt = Date.now() + FALLBACK_TTL_MS;
    }

    const toSave: Session = { ...s, expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("saveSession failed:", err);
    }
  }
}
