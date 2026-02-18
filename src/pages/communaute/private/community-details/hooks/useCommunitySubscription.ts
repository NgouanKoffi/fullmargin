// src/pages/communaute/private/community-details/hooks/useCommunitySubscription.ts
import { useCallback, useEffect, useState } from "react";
import { loadSession } from "../../../../../auth/lib/storage";

export type SubscriptionStatus = "none" | "pending" | "approved";

/**
 * Ouvre le modal d'auth si l'utilisateur n'est pas connecté.
 * Retourne true si l'utilisateur est connecté, false sinon.
 */
function ensureAuthenticated(): boolean {
  const token = loadSession()?.token;
  if (!token) {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
    );
    return false;
  }
  return true;
}

/**
 * Normalise n'importe quel statut string en
 * "none" | "pending" | "approved".
 * ➜ tout ce qui n’est pas pending/approved = none
 *    (ex: "left", "rejected", "", etc.)
 */
function normalizeSubscriptionStatus(
  raw: string | null | undefined
): SubscriptionStatus {
  const s = (raw || "").toLowerCase();
  if (s === "approved") return "approved";
  if (s === "pending") return "pending";
  return "none";
}

/**
 * Hook générique pour gérer l'abonnement / désabonnement à une communauté.
 * - centralise l'ouverture du modal d'auth
 * - gère le busy state
 * - met à jour le statut local (none / pending / approved)
 */
export function useCommunitySubscription(
  externalStatus: SubscriptionStatus = "none"
) {
  // ⚠️ on passe toujours par la normalisation,
  // au cas où on reçoive "left", "rejected", etc.
  const [status, setStatus] = useState<SubscriptionStatus>(() =>
    normalizeSubscriptionStatus(externalStatus)
  );
  const [busy, setBusy] = useState(false);

  // On reste synchronisé avec le statut fourni depuis l'extérieur,
  // mais uniquement via la version normalisée.
  useEffect(() => {
    setStatus(normalizeSubscriptionStatus(externalStatus as string));
  }, [externalStatus]);

  const join = useCallback(
    async (
      visibility: "public" | "private",
      onJoin?: (note?: string) => void | Promise<void>,
      note?: string
    ) => {
      if (busy) return;

      // Auth obligatoire
      if (!ensureAuthenticated()) return;

      try {
        setBusy(true);
        const p = onJoin?.(note);
        if (p && typeof (p as Promise<void>).then === "function") {
          await p;
        }
        // comportement optimiste
        setStatus(visibility === "public" ? "approved" : "pending");
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const leave = useCallback(
    async (onLeave?: () => void | Promise<void>) => {
      if (busy) return;

      try {
        setBusy(true);
        const p = onLeave?.();
        if (p && typeof (p as Promise<void>).then === "function") {
          await p;
        }
        // après désabonnement on force toujours à "none"
        setStatus("none");
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  return {
    status,
    setStatus,
    busy,
    setBusy,
    join,
    leave,
  };
}
