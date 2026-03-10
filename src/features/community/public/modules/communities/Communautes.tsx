// src/pages/communaute/public/sections/Communautes.tsx
import { useState, useMemo } from "react";

import SearchBar from "@shared/components/SearchBar";
import FilterBar from "@shared/components/FilterBar";
import CommunityCard, {
  type CommunityCardData,
} from "@shared/components/cards/CommunityCard";

// Shimmers
import CommunityCardSkeleton from "@shared/components/skeletons/CommunityCardSkeleton";
import {
  AvatarsScrollerSkeleton,
  FilterBarSkeleton,
} from "@shared/components/skeletons/FilterAndAvatarsSkeleton";
import { useCommunautesExplore } from "./communautes/Communautes.hooks";
import { CommunautesTabs } from "./communautes/CommunautesTabs";
import { TopCommunautesGrid } from "./communautes/TopCommunautesGrid";
import { Star } from "lucide-react";

type TabCommunautesProps = {
  dense?: boolean;

  /** ✅ Filtres de période (admin) : YYYY-MM-DD */
  filterFrom?: string;
  filterTo?: string;
};

/** Type auxiliaire pour récupérer proprement une note éventuelle */
type CommunityWithRating = CommunityCardData & {
  avgRating?: number | null;
  rating?: number | null;
};

/** Helper : récupère la note moyenne d'une communauté */
function getCommunityRating(c: CommunityCardData): number {
  const withRating = c as CommunityWithRating;
  const candidate = withRating.avgRating ?? withRating.rating;
  if (typeof candidate === "number" && !Number.isNaN(candidate)) {
    return candidate;
  }
  return 0;
}

/** Type auxiliaire pour la date de création (non typée dans CommunityCardData) */
type CommunityWithDates = CommunityCardData & {
  createdAt?: string | null;
  created_at?: string | null;
};

/** Récupère la date de création sous forme de timestamp (ms) ou null */
function getCommunityCreatedTime(c: CommunityCardData): number | null {
  const withDates = c as CommunityWithDates;
  const raw = withDates.createdAt || withDates.created_at;
  if (!raw) return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

/** Parse "YYYY-MM-DD" en timestamp (début de journée) ou null */
function parseDateOnly(value?: string): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

export function TabCommunautes({
  dense = false,
  filterFrom,
  filterTo,
}: TabCommunautesProps) {
  const {
    banner,
    query,
    setQuery,
    subTab,
    setSubTab,
    categoriesLabels,
    selectedCategories,
    toggleCategory,
    clearCategories,
    loadingList,
    loadingCats,
    error,
    grid,
    myGrid,
    topGrid,
    statusById,
    joinCommunity,
  } = useCommunautesExplore();

  const [minRating, setMinRating] = useState<number | null>(null);

  const gridCols = dense
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";

  const fromTs = useMemo(() => parseDateOnly(filterFrom), [filterFrom]);
  const toTs = useMemo(() => parseDateOnly(filterTo), [filterTo]);

  /** ✅ Vérifie si la communauté est dans la période sélectionnée */
  function matchesPeriod(c: CommunityCardData): boolean {
    // Pas de période → tout passe
    if (!fromTs && !toTs) return true;

    const createdTs = getCommunityCreatedTime(c);
    if (!createdTs) {
      // Si pas de date, on considère que ce n'est PAS dans la période admin
      return false;
    }

    if (fromTs && createdTs < fromTs) return false;

    if (toTs) {
      // on rend la limite supérieure inclusive (<= au jour choisi)
      const toInclusive = toTs + 24 * 60 * 60 * 1000;
      if (createdTs >= toInclusive) return false;
    }

    return true;
  }

  function renderCard(c: CommunityCardData) {
    const st = statusById[String(c.id)] || "none";
    const isPrivate = c.type === "private";

    const ctaLabel =
      c.role === "owner"
        ? ""
        : st === "approved"
        ? "Membre"
        : st === "pending"
        ? "Demande en cours"
        : isPrivate
        ? "Demander l’accès"
        : "Rejoindre";

    const disabled = c.role !== "none" || st === "pending";

    return (
      <CommunityCard
        key={c.id}
        data={c}
        className="h-full"
        ctaLabelOverride={ctaLabel}
        ctaDisabled={disabled}
        onPrimaryClick={joinCommunity}
      />
    );
  }

  /** 🔎 Listes filtrées par note + période */
  const filteredGrid = useMemo(
    () =>
      grid.filter((c) => {
        const okRating =
          minRating == null || getCommunityRating(c) >= minRating;
        const okPeriod = matchesPeriod(c);
        return okRating && okPeriod;
      }),
    [grid, minRating, fromTs, toTs]
  );

  const filteredMyGrid = useMemo(
    () =>
      myGrid.filter((c) => {
        const okRating =
          minRating == null || getCommunityRating(c) >= minRating;
        const okPeriod = matchesPeriod(c);
        return okRating && okPeriod;
      }),
    [myGrid, minRating, fromTs, toTs]
  );

  const filteredTopGrid = useMemo(
    () =>
      topGrid.filter((c) => {
        const okRating =
          minRating == null || getCommunityRating(c) >= minRating;
        const okPeriod = matchesPeriod(c);
        return okRating && okPeriod;
      }),
    [topGrid, minRating, fromTs, toTs]
  );

  const handleRatingClick = (value: number) => {
    setMinRating((prev) => (prev === value ? null : value));
  };

  return (
    <>
      {banner && (
        <div
          className={`mt-3 rounded-xl px-4 py-2 text-sm ${
            banner.kind === "success"
              ? "bg-emerald-600/90 text-white"
              : "bg-red-600/90 text-white"
          }`}
          role="status"
        >
          {banner.text}
        </div>
      )}

      {/* 🔍 Barre de recherche + filtres étoiles (en colonne) */}
      <div className="mt-4 flex flex-col gap-2">
        <SearchBar
          placeholder="Rechercher des communautés, jeux, thèmes…"
          onSearch={setQuery}
          defaultValue={query}
        />

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Filtrer par note :
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = minRating === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  className={`
                    inline-flex items-center justify-center rounded-full border px-2 py-1
                    text-[11px] sm:text-xs font-medium transition
                    ${
                      active
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        : "border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-500 dark:border-slate-600 dark:text-slate-300"
                    }
                  `}
                >
                  <Star
                    className={`mr-1 h-3.5 w-3.5 ${
                      active ? "fill-amber-400 text-amber-500" : ""
                    }`}
                  />
                  {value}+
                </button>
              );
            })}

            {minRating !== null && (
              <button
                type="button"
                onClick={() => setMinRating(null)}
                className="ml-1 text-[11px] sm:text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🧵 Tabs (Mes / Top / Toutes) */}
      <CommunautesTabs active={subTab} onChange={setSubTab} />

      {/* --- MES COMMUNAUTÉS --- */}
      {subTab === "mine" && (
        <section className="mt-5">
          {loadingList ? (
            <div
              className={`mt-2 grid gap-5 sm:gap-6 ${gridCols} items-stretch`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <CommunityCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredMyGrid.length > 0 ? (
            <div
              className={`mt-2 grid gap-5 sm:gap-6 ${gridCols} items-stretch`}
            >
              {filteredMyGrid.map(renderCard)}
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Aucune communauté ne correspond à vos filtres actuels
              {fromTs || toTs ? " (période / dates)" : ""}.
              <br />
              Essayez d&apos;ajuster la période ou la note minimale.
            </div>
          )}
        </section>
      )}

      {/* --- TOP COMMUNAUTÉS --- */}
      {subTab === "top" && (
        <section className="mt-5">
          {loadingList ? (
            <AvatarsScrollerSkeleton />
          ) : filteredTopGrid.length > 0 ? (
            <TopCommunautesGrid items={filteredTopGrid} />
          ) : (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Aucune communauté ne correspond à vos filtres actuels
              {fromTs || toTs ? " (période / dates)" : ""}.
            </div>
          )}
        </section>
      )}

      {/* --- TOUTES LES COMMUNAUTÉS --- */}
      {subTab === "all" && (
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Toutes les communautés
            </h3>
          </div>

          {loadingCats ? (
            <FilterBarSkeleton />
          ) : (
            <FilterBar
              categories={categoriesLabels}
              selected={selectedCategories}
              onToggle={toggleCategory}
              loading={false}
              onClearAll={clearCategories}
            />
          )}

          {error && !loadingList && (
            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {loadingList ? (
            <div
              className={`mt-4 grid gap-5 sm:gap-6 ${gridCols} items-stretch`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <CommunityCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div
                className={`mt-4 grid gap-5 sm:gap-6 ${gridCols} items-stretch`}
              >
                {filteredGrid.map(renderCard)}
              </div>

              {filteredGrid.length === 0 && (
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Aucune communauté ne correspond à votre recherche ni aux
                  filtres (période / note) sélectionnés.
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
