// src/components/Home/CommunityHub.tsx
import { useMemo } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import fmLogo from "../../assets/images/favicon.webp";

// ✅ on réutilise ta card + le hook existant (déjà utilisé dans Communautes.tsx)
import CommunityCard, {
  type CommunityCardData,
} from "../../pages/communaute/public/components/cards/CommunityCard";
import { useCommunautesExplore } from "../../pages/communaute/public/sections/communautes/Communautes.hooks";

/** ✅ Les 4 communautés à garder sur la Home */
const FEATURED_COMMUNITY_IDS = [
  "69107fa1dc142adbb9ab6a5e",
  "690c490ea0a8e5278e890169",
  "69203530518dd9dc2ac753b2",
  "691ebd0347861d4626eb2f56",
] as const;

function CommunityLoaderCard({
  onClick,
}: {
  onClick: () => void;
}): ReactElement {
  return (
    <div className="relative">
      {/* glow autour */}
      <div
        className="absolute -inset-5 rounded-[26px] blur-2xl bg-fm-primary/8 dark:bg-fm-primary/6 pointer-events-none"
        aria-hidden
      />

      {/* bloc cliquable */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className="relative overflow-hidden rounded-3xl bg-skin-surface/40 dark:bg-skin-surface/20 ring-1 ring-skin-border/10 shadow-[0_14px_35px_rgba(0,0,0,0.12)] backdrop-blur-sm h-[220px] flex flex-col items-center justify-center gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/60"
      >
        {/* shimmer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/4 to-transparent animate-[fm-shimmer_1.8s_linear_infinite]" />
        </div>

        {/* logo */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-skin-surface/80 dark:bg-black/30 ring-1 ring-white/10 shadow-md">
          <img
            src={fmLogo}
            alt="FullMargin"
            className="h-9 w-9 object-contain drop-shadow-md"
          />
        </div>

        {/* texte */}
        <div className="relative text-center">
          <p className="text-sm text-skin-muted/85">Communautés en cours…</p>
          <p className="mt-1 text-[11px] text-skin-muted/60">
            Cliquer pour voir l’espace
          </p>
        </div>

        {/* petit footer skeleton */}
        <div className="relative w-28 h-2 rounded-full bg-skin-border/10 overflow-hidden">
          <div className="h-full w-1/2 bg-fm-primary/60 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function CommunityHub(): ReactElement {
  const navigate = useNavigate();

  const goToCommunity = () => {
    navigate("/communaute");
  };

  // 🔥 On récupère les communautés depuis ton hook
  const { loadingList, grid, topGrid } = useCommunautesExplore();

  // ✅ On fusionne grid + topGrid (sans doublons) pour maximiser les chances de trouver tes IDs
  const all = useMemo(() => {
    const m = new Map<string, CommunityCardData>();
    [...(grid ?? []), ...(topGrid ?? [])].forEach((c) => {
      m.set(String(c.id), c);
    });
    return Array.from(m.values());
  }, [grid, topGrid]);

  // ✅ On prend EXACTEMENT tes IDs dans le bon ordre
  const featured = useMemo(() => {
    const byId = new Map(all.map((c) => [String(c.id), c]));
    return FEATURED_COMMUNITY_IDS.map((id) => byId.get(id)).filter(
      Boolean
    ) as CommunityCardData[];
  }, [all]);

  // ✅ Toujours afficher 4 items (si certaines commus manquent => loaders)
  const missingCount = Math.max(0, 4 - featured.length);
  const fallbackLoaders = useMemo(
    () => Array.from({ length: missingCount }),
    [missingCount]
  );

  return (
    <>
      {/* keyframes pour le shimmer */}
      <style>
        {`
          @keyframes fm-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>

      <section id="join" className="w-full">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-16 lg:py-24">
          {/* HEADER CENTRÉ */}
          <div className="max-w-[1050px] mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-skin-base">
              Avancez ensemble, progressez plus vite
            </h2>
            <p className="mt-4 text-skin-muted text-base sm:text-lg leading-relaxed">
              Des débutants aux traders aguerris, Fullmargin est l’espace où
              l’expertise se partage et les communautés se créent.
            </p>
          </div>

          {/* ✅ GRID COMMUNAUTÉS (cards) */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {loadingList && featured.length === 0 ? (
              // loading initial => 4 loaders
              Array.from({ length: 4 }).map((_, idx) => (
                <CommunityLoaderCard key={idx} onClick={goToCommunity} />
              ))
            ) : (
              <>
                {featured.map((c) => (
                  <CommunityCard
                    key={c.id}
                    data={{
                      ...c,
                      // sécurité : si pas de href, on construit le lien
                      href:
                        c.href ??
                        `/communaute/${encodeURIComponent(String(c.id))}`,
                      // sécurité : certains backends renvoient rating null/undefined
                      rating:
                        typeof c.rating === "number" && !Number.isNaN(c.rating)
                          ? c.rating
                          : 0,
                    }}
                    className="h-full"
                  />
                ))}

                {/* si une ou plusieurs communautés manquent => loaders restants */}
                {fallbackLoaders.map((_, idx) => (
                  <CommunityLoaderCard
                    key={`fallback-${idx}`}
                    onClick={goToCommunity}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
