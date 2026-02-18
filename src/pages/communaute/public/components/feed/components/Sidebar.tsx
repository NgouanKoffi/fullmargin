// src/pages/communaute/public/components/feed/components/Sidebar.tsx
import { Users, ChevronRight as ChevronRightIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../../../../../lib/api";

/* =========================================================
   UI générique
   ========================================================= */
export function SidebarCard({
  title,
  icon,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-4">
        {icon}
        <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
      {actionLabel && (
        <div className="px-4 sm:px-5 pb-4">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            {actionLabel} <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Types
   ========================================================= */
type CommunityLite = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverUrl?: string;
  membersCount: number;
};

type RatingAvg = {
  communityId: string;
  count: number;
  avg: number | null; // null si aucun avis
};

// Réponse brute de /public : peut contenir id OU _id, et un owner inutile ici
type RawCommunity = Partial<CommunityLite> & { _id?: string; owner?: unknown };

type PublicListResponse = {
  ok: boolean;
  data?: { items: RawCommunity[] } | RawCommunity[];
};

type RatingsResponse = {
  ok: boolean;
  data?: { items: RatingAvg[] } | RatingAvg[];
};

/* =========================================================
   Helpers
   ========================================================= */
const BASE = API_BASE.replace(/\/+$/, "");

const API = {
  publicCommunities: `${BASE}/communaute/communities/public`,
  ratingsAvg: `${BASE}/communaute/communities/ratings/avg`,
};

function cn(...cls: Array<string | false | undefined | null>) {
  return cls.filter(Boolean).join(" ");
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

/* =========================================================
   Pastille de note brillante (remplace les étoiles)
   ========================================================= */
function ScoreBadge({
  value,
  count = 0,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const txt =
    round1(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "/5";

  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full font-semibold text-white",
        "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500",
        "shadow-[0_6px_20px_-8px_rgba(124,58,237,0.6)] ring-1 ring-white/10 overflow-hidden",
        padding,
        textSize
      )}
      aria-label={`Note ${txt} basée sur ${count} avis`}
    >
      <span className="tabular-nums">{txt}</span>
      <span className="opacity-85">({count})</span>

      {/* reflet animé */}
      <span className="pointer-events-none absolute inset-0 before:absolute before:-left-1/3 before:top-0 before:h-full before:w-1/3 before:bg-white/35 before:blur-[6px] before:rotate-6 before:animate-[shine_2.8s_linear_infinite]" />
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-140%) skewX(-10deg); }
          60% { transform: translateX(180%) skewX(-10deg); }
          100% { transform: translateX(180%) skewX(-10deg); }
        }
      `}</style>
    </span>
  );
}

/* =========================================================
   Skeleton (anti-clignotement)
   ========================================================= */
function ItemSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-black/5 dark:ring-white/10 bg-white/50 dark:bg-white/5">
      <div className="h-10 w-10 rounded-lg bg-black/10 dark:bg-white/10 animate-pulse" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="h-3 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
      </div>
      <div className="h-5 w-20 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
    </li>
  );
}

/* =========================================================
   Liste dynamique (nom + nb abonnés + note)
   ========================================================= */
export function SimilarCommunities({
  max = 4,
  category,
}: {
  max?: number;
  category?: string;
}) {
  const [items, setItems] = useState<
    Array<CommunityLite & { rating?: RatingAvg | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(items.length === 0);

        // 1) communautés publiques
        const query = category
          ? `?category=${encodeURIComponent(category)}`
          : "";
        const r = await fetch(`${API.publicCommunities}${query}`, {
          headers: { "Cache-Control": "no-store" },
        });

        if (!r.ok) {
          console.error(
            "[SimilarCommunities] publicCommunities error:",
            r.status,
            r.statusText
          );
          if (!cancelled) setLoading(false);
          return;
        }

        const j = (await r.json()) as PublicListResponse;

        // accepte data.items ou data direct
        const rawArr = Array.isArray(j.data) ? j.data : j.data?.items || [];

        const raw = rawArr
          .map((c) => ({
            id: String((c.id ?? c._id) || ""),
            name: String(c.name || ""),
            slug: String(c.slug || ""),
            logoUrl: c.logoUrl || "",
            coverUrl: c.coverUrl || "",
            membersCount: Number(c.membersCount || 0),
          }))
          .filter((c) => c.id && c.name);

        const top = raw
          .sort((a, b) => b.membersCount - a.membersCount)
          .slice(0, Math.max(1, Math.min(max, 12)));

        // 2) notes moyennes
        const ids = top.map((x) => x.id).join(",");
        let ratingMap = new Map<string, RatingAvg>();
        if (ids) {
          const r2 = await fetch(
            `${API.ratingsAvg}?ids=${encodeURIComponent(ids)}`,
            {
              headers: { "Cache-Control": "no-store" },
            }
          );

          if (!r2.ok) {
            console.error(
              "[SimilarCommunities] ratingsAvg error:",
              r2.status,
              r2.statusText
            );
          } else {
            const j2 = (await r2.json()) as RatingsResponse;
            const arr = Array.isArray(j2.data) ? j2.data : j2.data?.items || [];
            ratingMap = new Map(arr.map((a) => [a.communityId, a]));
          }
        }

        const merged = top.map((c) => ({
          ...c,
          rating: ratingMap.get(c.id) || {
            communityId: c.id,
            count: 0,
            avg: null,
          },
        }));

        // tri final: note desc (null en bas) -> membres desc -> nom asc
        merged.sort((a, b) => {
          const av = a.rating?.avg ?? -1;
          const bv = b.rating?.avg ?? -1;
          if (av !== bv) return bv - av;
          if (a.membersCount !== b.membersCount)
            return b.membersCount - a.membersCount;
          return a.name.localeCompare(b.name);
        });

        const final = merged.slice(0, Math.max(1, Math.min(max, 4)));

        if (!cancelled) {
          const sig = JSON.stringify(final);
          if (sig !== savedRef.current) {
            savedRef.current = sig;
            setItems(final);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("[SimilarCommunities] load error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    load();

    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    const iv = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, category]);

  if (loading && items.length === 0) {
    return (
      <ul className="space-y-3">
        <ItemSkeleton />
        <ItemSkeleton />
        <ItemSkeleton />
        <ItemSkeleton />
      </ul>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucune communauté similaire disponible pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((c) => {
        const to = c.slug ? `/communaute/${c.slug}` : `/communaute/${c.id}`;

        // Élément de droite (note ou fallback)
        const ratingEl =
          typeof c.rating?.avg === "number" ? (
            <ScoreBadge
              value={c.rating.avg}
              count={c.rating?.count ?? 0}
              size="sm"
            />
          ) : (
            <span className="text-xs opacity-70 whitespace-nowrap">
              {/* Pas encore notée */}
            </span>
          );

        return (
          <li
            key={c.id}
            className="group relative rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white/50 dark:bg-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors"
          >
            <Link
              to={to}
              className="absolute inset-0"
              aria-label={`Ouvrir la communauté ${c.name}`}
            />
            {/* Ligne pleine largeur : gauche (logo + textes) / droite (note) */}
            <div className="pointer-events-none flex items-center gap-3 p-3">
              {/* Logo */}
              <div className="h-10 w-10 rounded-lg overflow-hidden ring-1 ring-violet-500/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                {c.logoUrl ? (
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs font-semibold text-violet-700/70 dark:text-violet-200">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Colonne texte (prend la place) */}
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium text-sm truncate">{c.name}</p>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {Intl.NumberFormat("fr-FR").format(c.membersCount)} membres
                  </span>
                </div>
              </div>

              {/* Colonne droite (note) */}
              <div className="shrink-0">{ratingEl}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* =========================================================
   Variante carte complète avec bouton "Explorer plus"
   ========================================================= */
export function SimilarCommunitiesCard({
  title = "Communautés populaires",
  icon = <Users className="h-4 w-4" />,
  max = 4,
  category,
}: {
  title?: string;
  icon?: React.ReactNode;
  max?: number;
  category?: string;
}) {
  const navigate = useNavigate();
  return (
    <SidebarCard
      title={title}
      icon={icon}
      actionLabel="Explorer plus"
      onAction={() => navigate("/communaute")}
    >
      <SimilarCommunities max={max} category={category} />
    </SidebarCard>
  );
}
