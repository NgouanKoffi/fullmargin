// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\utils\useSellerBalance.ts
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

/** Données exposées par le hook */
export type SellerBalance = {
  currency: string;
  available: number; // solde marketplace dispo
  pending: number; // marketplace en attente
  community: number; // 💜 solde formations / communauté (payouts)
  affiliation: number; // solde affiliation
};

type BalanceApi = {
  ok?: boolean;
  data?: {
    currency?: string;
    available?: number;
    pending?: number;
  };
  error?: string;
};

// ce qu’on reçoit de /affiliation/me
type AffiliationMeApi = {
  ok?: boolean;
  data?: {
    totals?: Record<string, number>; // en CENTS
  };
  error?: string;
};

// ce qu’on reçoit de /courses/payouts/mine/summary
type CoursesSummaryApi = {
  ok?: boolean;
  data?: {
    summary?: {
      currency?: string;
      available?: number;
      pending?: number;
      paidLifetime?: number;
      grossLifetime?: number;
      commissionLifetime?: number;
      count?: number;
    }[];
  };
  error?: string;
};

type AuthError = Error & {
  code?: number;
};

const DEFAULT_BALANCE: SellerBalance = {
  currency: "USD",
  available: 0,
  pending: 0,
  community: 0,
  affiliation: 0,
};

const up = (s?: string) => (s || "").toUpperCase().trim();

/**
 * GET marketplace + affiliation + communauté (payouts cours)
 */
async function fetchBoth(
  token: string,
  signal?: AbortSignal
): Promise<SellerBalance> {
  if (!token) {
    return DEFAULT_BALANCE;
  }

  const base = API_BASE.replace(/\/+$/, "");
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // marketplace + affiliation + résumés de payouts
  const [mkRes, affRes, coursesRes] = await Promise.all([
    fetch(`${base}/marketplace/profile/balance`, {
      method: "GET",
      headers,
      mode: "cors",
      credentials: "include",
      cache: "no-store",
      signal,
    }),
    fetch(`${base}/affiliation/me`, {
      method: "GET",
      headers,
      mode: "cors",
      credentials: "include",
      cache: "no-store",
      signal,
    }),
    fetch(`${base}/courses/payouts/mine/summary`, {
      method: "GET",
      headers,
      mode: "cors",
      credentials: "include",
      cache: "no-store",
      signal,
    }),
  ]);

  // marketplace → bloquant
  if (mkRes.status === 401) {
    const err: AuthError = new Error("401");
    err.code = 401;
    throw err;
  }

  if (!mkRes.ok) {
    throw new Error(
      (await mkRes.text().catch(() => "")) ||
        "Chargement du solde marketplace impossible"
    );
  }

  const mk = (await mkRes.json()) as BalanceApi;

  const mkCurrency = up(mk?.data?.currency || "USD");
  const mkAvailable =
    typeof mk?.data?.available === "number" ? mk.data.available : 0;
  const mkPending = typeof mk?.data?.pending === "number" ? mk.data.pending : 0;

  // 💰 affiliation (non bloquant)
  let affiliation = 0;
  try {
    const aff = (await affRes.json()) as AffiliationMeApi;
    if (aff?.ok && aff.data?.totals) {
      const totals = aff.data.totals;
      const raw =
        totals[mkCurrency] ??
        totals[mkCurrency.toLowerCase()] ??
        totals[mkCurrency.toUpperCase()];
      if (typeof raw === "number") {
        affiliation = raw / 100; // on repasse en unités
      }
    }
  } catch {
    affiliation = 0;
  }

  // 💜 communauté (payouts cours, non bloquant)
  let community = 0;
  try {
    if (coursesRes.ok) {
      const cp = (await coursesRes.json()) as CoursesSummaryApi;
      const list = cp?.data?.summary || [];
      if (Array.isArray(list) && list.length > 0) {
        const found =
          list.find((s) => up(s.currency) === mkCurrency) || list[0];
        if (typeof found.available === "number") {
          community = found.available; // déjà en unités (on avait divisé par 100 côté backend)
        }
      }
    }
  } catch {
    community = 0;
  }

  return {
    currency: mkCurrency,
    available: mkAvailable,
    pending: mkPending,
    community,
    affiliation,
  };
}

/**
 * Hook: lit le solde marketplace + communauté (payouts) + affiliation
 */
export function useSellerBalance() {
  const token = loadSession()?.token || "";
  const [loading, setLoading] = useState<boolean>(false);
  const [bal, setBal] = useState<SellerBalance>(DEFAULT_BALANCE);
  const [error, setError] = useState<string>("");

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      if (!token) {
        if (alive) {
          setBal(DEFAULT_BALANCE);
          setError("");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const next = await fetchBoth(token, ctrl.signal);
        if (alive) setBal(next);
      } catch (err) {
        if (!alive) return;
        const authErr = err as AuthError;
        if (authErr.code === 401) {
          setBal(DEFAULT_BALANCE);
          setError("");
        } else {
          const msg =
            authErr instanceof Error
              ? authErr.message
              : "Erreur lors du chargement";
          setError(msg);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();

    // refresh silencieux toutes les 30s
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (token) {
      intervalRef.current = window.setInterval(() => {
        fetchBoth(token)
          .then((next) => {
            setBal(next);
          })
          .catch(() => {
            // on ignore les erreurs de refresh silencieux
          });
      }, 30_000);
    }

    return () => {
      alive = false;
      ctrl.abort();
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [token]);

  return { loading, bal, error };
}
