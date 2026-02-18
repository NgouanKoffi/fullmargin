// C:\Users\ADMIN\Desktop\fullmargin-site\src\auth\lib\authApi.ts
import { api } from "../../lib/api";
import type { User } from "../types";

/**
 * apiMe doit distinguer :
 * - null      => token invalide / expiré (401/403) => logout OK
 * - undefined => erreur réseau / serveur / timeout => NE PAS logout
 * - User      => OK
 *
 * ⚠️ Ton wrapper `api.get()` semble jeter une exception sur les statuts non-2xx.
 * On essaye donc de lire le status depuis l'erreur (shape variable selon ton wrapper).
 */
export async function apiMe(token: string): Promise<User | null | undefined> {
  try {
    const me = await api.get<User | null>("/auth/me", {
      withAuth: false, // on force le token fourni
      headers: { Authorization: `Bearer ${token}` },
    });

    // Si le backend renvoie explicitement null (rare), on traite comme unauthorized
    if (!me) return null;
    return me;
  } catch (err: any) {
    // --- Détection status la plus robuste possible ---
    const status =
      err?.status ??
      err?.response?.status ??
      err?.response?.statusCode ??
      err?.data?.status ??
      err?.data?.code ??
      err?.code;

    // 401/403 => token invalide/expiré => logout OK
    if (status === 401 || status === 403) return null;

    // Sinon => problème réseau / serveur => on garde la session
    if (import.meta.env?.DEV) {
      console.warn("[apiMe] non-auth failure => keep session", {
        status,
        message: err?.message,
      });
    }
    return undefined;
  }
}

/* ---------------------- Types de réponses (utiles en import) ---------------------- */
export type LoginRequestResponse = {
  ok: boolean;
  error?: string;
  loginId?: string;
  id?: string;
  masked?: string;
  expiresInSec?: number;
};

export type RegisterRequestResponse = {
  ok: boolean;
  error?: string;
  regId?: string;
  id?: string;
  masked?: string;
  expiresInSec?: number;
};

/** Étape 1 Login (envoi email+password, potentiellement suivi d’un code 2FA) */
export async function loginRequest(email: string, password: string) {
  return api.post<LoginRequestResponse>(
    "/auth/login/request",
    { email, password },
    { withAuth: false }
  );
}

/**
 * Étape 1 Register (envoi fullName+email+password ; supporte un code de parrainage optionnel)
 * @param fullName
 * @param email
 * @param password
 * @param referralCode (optionnel) — code d’affiliation si présent dans l’URL ?ref=...
 */
export async function registerRequest(
  fullName: string,
  email: string,
  password: string,
  referralCode?: string
) {
  const payload = referralCode
    ? { fullName, email, password, referralCode }
    : { fullName, email, password };

  return api.post<RegisterRequestResponse>("/auth/register/request", payload, {
    withAuth: false,
  });
}
