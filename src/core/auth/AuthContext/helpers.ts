// src/auth/AuthContext/helpers.ts
import type { Session } from "../types";
import { buildAuthSuccessUrl } from "../lib/helpers";

/* ---------------- Helpers génériques ---------------- */

export function getErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue"
) {
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

/** Intent: lire & nettoyer l’intention post-login */
export function readAndClearIntent(): string | null {
  try {
    const k1 = "fm:auth:intent";
    const k2 = "fm:oauth:from"; // compat existant
    const raw = localStorage.getItem(k1) || localStorage.getItem(k2);
    if (raw) {
      localStorage.removeItem(k1);
      localStorage.removeItem(k2);
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Sécurisation: n’autoriser que des URL même origine ou des chemins relatifs */
export function sanitizeRedirect(
  url: string | null | undefined
): string | null {
  try {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) {
      return u.pathname + u.search + u.hash;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Si aucune intention: valeur par défaut sûre */
export function fallbackAfterAuth(
  session: Session,
  serverUrl?: string
): string {
  return serverUrl || buildAuthSuccessUrl(session);
}

/* -------- Type guards pour login payload -------- */
export type LoginPayloadBase = { ok: boolean; error?: string };

export type LoginPayloadNeeds2FA = LoginPayloadBase & {
  ok: true;
  loginId?: string;
  id?: string;
  masked?: string;
  expiresInSec?: number;
};

export type LoginPayloadNo2FA = LoginPayloadBase & {
  ok: true;
  session: Session;
  redirectUrl?: string;
};

export function isNo2FA(p: unknown): p is LoginPayloadNo2FA {
  if (!p || typeof p !== "object") return false;
  const obj = p as { ok?: boolean; session?: { token?: unknown } };
  return (
    obj.ok === true && !!obj.session && typeof obj.session.token === "string"
  );
}

export function isNeeds2FA(p: unknown): p is LoginPayloadNeeds2FA {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  const ok = o["ok"] === true;
  const hasLoginId = typeof o["loginId"] === "string" && !!o["loginId"];
  const hasId = typeof o["id"] === "string" && !!o["id"];
  return ok && (hasLoginId || hasId);
}

/* -------- Referral -------- */
export const getReferral = (): string | undefined => {
  const fromUrl = new URLSearchParams(window.location.search).get("ref");
  const fromStorage = localStorage.getItem("fm:referral");
  const val = (fromUrl || fromStorage || "").trim().toUpperCase();
  return val || undefined;
};

/* -------- Suppression temporaire du modal (logout) -------- */
export const SUPPRESS_KEY = "fm:suppress-auth-modal-until";
export const SUPPRESS_TTL_MS = 5000;
