// src/pages/journal/tabs/accounts/ActionBar.tsx
import { Plus, Filter, SlidersHorizontal, Search, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GlobalCurrencyBar from "./GlobalCurrencyBar";
import type { Currency } from "../../types";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  onCreate: () => void;
  onExport: () => void;

  globalCurrency: Currency;
  setGlobalCurrency: (c: Currency) => void;
  applyGlobalCurrency: (c: Currency) => void;
  busyGlobal: boolean;

  /** ✅ Optionnel : pour réutiliser ailleurs (ex: Finance) */
  storageKey?: string; // ex: "fm.journal.filters.open" / "fm.finance.filters.open"
  defaultOpen?: boolean; // par défaut: false
};

export default function ActionBar({
  query,
  setQuery,
  from,
  setFrom,
  to,
  setTo,
  onCreate,
  onExport,
  globalCurrency,
  setGlobalCurrency,
  applyGlobalCurrency,
  busyGlobal,
  storageKey = "fm.journal.filters.open",
}: Props) {
  // ✅ CORRECTION ICI : On initialise à false directement (fermé par défaut)
  // On ne lit plus le localStorage au démarrage.
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // On continue d'écrire dans le localStorage si besoin (optionnel)
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, filterOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [filterOpen, storageKey]);

  const resetFilters = () => {
    setQuery("");
    setFrom("");
    setTo("");
  };

  const activeCount = useMemo(() => {
    let c = 0;
    if (query.trim()) c += 1;
    if (from) c += 1;
    if (to) c += 1;
    return c;
  }, [query, from, to]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    const q = query.trim();
    if (q) parts.push(`Recherche: ${q.length > 18 ? q.slice(0, 18) + "…" : q}`);
    if (from || to) parts.push(`Période: ${from || "…"} → ${to || "…"}`);
    return parts.join(" · ");
  }, [query, from, to]);

  return (
    <section className="space-y-3">
      {/* barre d'actions centrée */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
          >
            <Plus className="w-4 h-4" />
            Créer un compte
          </button>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Filter className="w-4 h-4" />
            Exporter (PDF)
          </button>
        </div>
      </div>

      {/* bloc filtres (compact quand fermé) */}
      <div
        className={[
          "rounded-2xl shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/50 bg-slate-50 dark:bg-slate-800/60",
          filterOpen ? "p-4 pb-3" : "px-4 py-3",
        ].join(" ")}
      >
        {/* en-tête filtres */}
        <div
          className={
            "flex items-center justify-between gap-3" +
            (filterOpen ? " mb-3" : "")
          }
        >
          {/* Bouton Reset à GAUCHE */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>

          {/* Badges et résumé au CENTRE */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {activeCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-indigo-600 text-white text-[11px] px-2 py-0.5">
                {activeCount}
              </span>
            )}

            {!filterOpen && summary ? (
              <span className="hidden sm:inline text-xs text-slate-400 truncate">
                {summary}
              </span>
            ) : null}
          </div>

          {/* Bouton Filtres à DROITE */}
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0"
            title={filterOpen ? "Masquer les filtres" : "Afficher les filtres"}
            aria-expanded={filterOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {filterOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {filterOpen && (
          <div
            className="
              grid gap-3
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-5
            "
          >
            {/* recherche */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300 col-span-1 xl:col-span-2">
              <span>Recherche</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un compte (nom, devise, description)…"
                  className="w-full h-10 rounded-lg pl-9 pr-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </label>

            {/* date début */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Date début</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
              />
            </label>

            {/* date fin */}
            <label className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-slate-300">
              <span>Date fin</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
              />
            </label>



            {/* devise globale */}
            <div className="col-span-1 xl:col-span-5">
              <GlobalCurrencyBar
                globalCurrency={globalCurrency}
                setGlobalCurrency={setGlobalCurrency}
                applyGlobalCurrency={applyGlobalCurrency}
                busyGlobal={busyGlobal}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
