// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\VentesTab.tsx
import { useEffect, useState } from "react";
import {
  Banknote,
  Filter,
  RefreshCcw,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

/* ---------- Types ---------- */
type SessionUser = { _id?: string; id?: string };
type Session = { token?: string; user?: SessionUser } | null;

type VentesFilters = {
  status: "all" | "available" | "pending" | "paid";
  currency: string; // pour plus tard si tu veux filtrer par devise
  q: string;
};

type SellerSummaryItem = {
  currency: string;
  available: number;
  pending: number;
  paidLifetime: number;
  grossLifetime: number;
  commissionLifetime: number;
  count: number;
};

type BuyerLite = {
  id: string;
  name: string;
  avatar: string;
  email: string;
} | null;

type CourseLite = {
  id: string;
  title: string;
  coverUrl: string;
  communityId: string | null;
} | null;

type SellerPayoutItem = {
  id: string;
  status: "available" | "pending" | "paid";
  currency: string;
  commissionRate: number;
  createdAt: string | null;
  orderId: string | null;
  amounts: {
    unit: number | null;
    gross: number | null;
    commission: number | null;
    net: number | null;
    unitCents: number | null;
    grossCents: number | null;
    commissionCents: number | null;
    netCents: number | null;
  };
  course: CourseLite;
  buyer: BuyerLite;
};

/* ---------- Helpers ---------- */
function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function money(val?: number | null, cur?: string): string {
  if (val == null) return "";
  const c = (cur || "").toUpperCase();
  return `${val.toFixed(2)} ${c}`;
}

/* ---------- Composant ---------- */
export default function VentesTab() {
  const [filters, setFilters] = useState<VentesFilters>({
    status: "all",
    currency: "",
    q: "",
  });

  const [summary, setSummary] = useState<SellerSummaryItem[]>([]);
  const [rows, setRows] = useState<SellerPayoutItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (patch: Partial<VentesFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    // reset pagination et recharge depuis la page 1
    setPage(1);
    fetchRows(1, next, true);
    fetchSummary(); // le résumé ne filtre pas par status pour l’instant
  };

  async function fetchSummary() {
    try {
      setSummaryLoading(true);
      const res = await fetch(`${API_BASE}/courses/payouts/mine/summary`, {
        headers: { Accept: "application/json", ...authHeaders() },
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = "Lecture du résumé impossible";
        try {
          const j = JSON.parse(raw) as { error?: string; message?: string };
          msg = j.error || j.message || msg;
        } catch {
          if (raw) msg = raw;
        }
        throw new Error(msg);
      }
      let j: { ok?: boolean; data?: { summary?: SellerSummaryItem[] } } | null =
        null;
      try {
        j = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide du serveur (summary)");
      }
      setSummary(j?.data?.summary || []);
    } catch (e) {
      console.error(e);
      setSummary([]);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function fetchRows(
    targetPage: number,
    currentFilters: VentesFilters,
    replace = false
  ) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", "20");
      if (currentFilters.q.trim()) params.set("q", currentFilters.q.trim());
      if (currentFilters.currency.trim())
        params.set("currency", currentFilters.currency.trim().toLowerCase());
      if (currentFilters.status !== "all")
        params.set("status", currentFilters.status);

      const res = await fetch(
        `${API_BASE}/courses/payouts/mine?${params.toString()}`,
        { headers: { Accept: "application/json", ...authHeaders() } }
      );

      const raw = await res.text();
      if (!res.ok) {
        let msg = "Lecture des ventes impossible";
        try {
          const j = JSON.parse(raw) as { error?: string; message?: string };
          msg = j.error || j.message || msg;
        } catch {
          if (raw) msg = raw;
        }
        throw new Error(msg);
      }

      let json: {
        ok?: boolean;
        data?: {
          items?: SellerPayoutItem[];
          page?: number;
          limit?: number;
          total?: number;
          hasMore?: boolean;
        };
      } | null = null;

      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error("Réponse invalide du serveur (ventes)");
      }

      const data = json?.data || {};
      const items = data.items || [];
      const nextHasMore = !!data.hasMore;

      setHasMore(nextHasMore);
      setPage(data.page || targetPage);

      setRows((prev) => (replace ? items : [...prev, ...items]));
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Lecture des ventes impossible"
      );
      setRows([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setPage(1);
    fetchSummary();
    fetchRows(1, filters, true);
  }

  function handleLoadMore() {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    fetchRows(nextPage, filters, false);
  }

  // Chargement initial
  useEffect(() => {
    fetchSummary();
    fetchRows(1, filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <section className="space-y-4 sm:space-y-5">
        {/* Header + actions */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Ventes</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Filtre status */}
              <div className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4 opacity-70" />
                <select
                  className="rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) =>
                    handleChange({
                      status: e.target.value as VentesFilters["status"],
                    })
                  }
                >
                  <option value="all">Tous les états</option>
                  <option value="available">Disponible</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                </select>
              </div>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
                <input
                  value={filters.q}
                  onChange={(e) => handleChange({ q: e.target.value })}
                  placeholder="Rechercher (cours, acheteur, id...)"
                  className="pl-8 pr-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/40"
                />
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-900"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Actualiser
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        {/* Summary */}
        {summaryLoading ? (
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 ring-1 ring-black/5 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement du résumé des ventes…
          </div>
        ) : summary.length === 0 ? (
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 ring-1 ring-black/5 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
            Aucun résumé disponible.
          </div>
        ) : summary.length === 1 ? (
          // 👉 un seul résumé → on occupe toute la largeur et on étale
          <div className="rounded-xl p-4 ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-slate-900/40 w-full">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* gauche */}
              <div>
                <div className="text-xs opacity-70">
                  {(summary[0].currency || "").toUpperCase()}
                </div>
                <div className="mt-2 text-sm">Disponible</div>
                <div className="text-3xl font-semibold">
                  {money(summary[0].available, summary[0].currency)}
                </div>
                <div className="mt-2 text-xs opacity-70">
                  Transactions : {summary[0].count}
                </div>
              </div>

              {/* droite */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm min-w-[280px]">
                <div>
                  <div className="text-xs opacity-70">En attente</div>
                  <div className="font-medium">
                    {money(summary[0].pending, summary[0].currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Payé (vie)</div>
                  <div className="font-medium">
                    {money(summary[0].paidLifetime, summary[0].currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Brut (vie)</div>
                  <div className="font-medium">
                    {money(summary[0].grossLifetime, summary[0].currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Com. (vie)</div>
                  <div className="font-medium">
                    {money(summary[0].commissionLifetime, summary[0].currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // plusieurs devises → grille
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map((s) => (
              <div
                key={s.currency}
                className="rounded-xl p-4 ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-slate-900/40"
              >
                <div className="text-xs opacity-70">
                  {(s.currency || "").toUpperCase()}
                </div>
                <div className="mt-2 text-sm">Disponible</div>
                <div className="text-xl font-semibold">
                  {money(s.available, s.currency)}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="opacity-70">En attente</div>
                    <div className="font-medium">
                      {money(s.pending, s.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="opacity-70">Payé (vie)</div>
                    <div className="font-medium">
                      {money(s.paidLifetime, s.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="opacity-70">Brut (vie)</div>
                    <div className="font-medium">
                      {money(s.grossLifetime, s.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="opacity-70">Com. (vie)</div>
                    <div className="font-medium">
                      {money(s.commissionLifetime, s.currency)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs opacity-70">
                  Transactions : {s.count}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
          <div className="hidden md:grid grid-cols-[56px_1.2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-medium bg-slate-50/70 dark:bg-slate-800/40">
            <div />
            <div>Cours</div>
            <div>Acheteur</div>
            <div>Brut</div>
            <div>Commission</div>
            <div>Net / État</div>
          </div>

          {rows.length === 0 ? (
            <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
              {loading ? "Chargement des ventes…" : "Aucune vente trouvée."}
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="grid md:grid-cols-[56px_1.2fr_1fr_1fr_1fr_1fr] grid-cols-1 gap-3 px-4 py-3 items-center bg-white dark:bg-slate-900"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/5 dark:bg-white/10">
                    {r.course?.coverUrl ? (
                      <img
                        src={r.course.coverUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-slate-500 dark:text-slate-300">
                        Cours
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">{r.course?.title || "—"}</div>
                    <div className="text-xs opacity-70">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "—"}{" "}
                      • #{r.orderId || "—"}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">{r.buyer?.name || "—"}</div>
                    <div className="text-xs opacity-70">
                      {r.buyer?.email || ""}
                    </div>
                  </div>

                  <div className="text-sm">
                    {money(
                      r.amounts.gross ?? (r.amounts.grossCents ?? 0) / 100,
                      r.currency
                    )}
                  </div>
                  <div className="text-sm">
                    {money(
                      r.amounts.commission ??
                        (r.amounts.commissionCents ?? 0) / 100,
                      r.currency
                    )}
                  </div>

                  <div className="text-sm">
                    <div className="font-semibold">
                      {money(
                        r.amounts.net ?? (r.amounts.netCents ?? 0) / 100,
                        r.currency
                      )}
                    </div>
                    <div className="text-xs">
                      {r.status === "available"
                        ? "Disponible"
                        : r.status === "pending"
                        ? "En attente"
                        : "Payé"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-70">Page {page}</div>
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-slate-900"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Charger plus
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
