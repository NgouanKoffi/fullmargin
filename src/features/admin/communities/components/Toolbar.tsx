// src/features/admin/communities/components/Toolbar.tsx
import { Search, CalendarRange, Filter } from "lucide-react";
import type { TabKey } from "../types";

type Props = {
  tab: TabKey;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  minCount: number | "";
  setMinCount: (v: number | "") => void;
  hasFilters: boolean;
  clearFilters: () => void;
};

const TAB_LABELS: Record<TabKey, string> = {
  communities: "Communautés",
  courses: "Formations",
  requests: "Demandes de suppression",
};

export function Toolbar({
  tab, searchQuery, setSearchQuery,
  dateFrom, setDateFrom, dateTo, setDateTo,
  minCount, setMinCount, hasFilters, clearFilters,
}: Props) {
  const isCommunitiesLike = tab === "communities" || tab === "requests";

  return (
    <div className="p-4 sm:p-5 border-b border-skin-border/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-skin-surface/50">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold text-skin-base">{TAB_LABELS[tab]}</h2>
        <p className="text-xs text-skin-muted mt-0.5">
          Gérez l'ensemble des {TAB_LABELS[tab].toLowerCase()} actives.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
        {/* Recherche */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-skin-muted" />
          <input
            type="text"
            placeholder={isCommunitiesLike ? "Rechercher une communauté..." : "Rechercher une formation..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-skin-border/30 bg-skin-surface focus:outline-none focus:ring-2 focus:ring-violet-500/50 shadow-sm transition-all"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-skin-border/30 bg-skin-surface shadow-sm">
            <CalendarRange className="w-4 h-4 text-skin-muted" />
            <input type="date" title="Date de début" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-skin-base text-xs focus:outline-none w-28" />
            <span className="text-skin-muted text-xs">à</span>
            <input type="date" title="Date de fin" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-skin-base text-xs focus:outline-none w-28" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-skin-border/30 bg-skin-surface shadow-sm">
            <Filter className="w-4 h-4 text-skin-muted" />
            <input
              type="number"
              min="0"
              placeholder={isCommunitiesLike ? "Min. abonnés" : "Min. inscrits"}
              value={minCount}
              onChange={(e) => setMinCount(e.target.value ? Number(e.target.value) : "")}
              className="bg-transparent text-skin-base text-xs focus:outline-none w-24 placeholder:text-skin-muted"
            />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-500/10 transition">
              Effacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
