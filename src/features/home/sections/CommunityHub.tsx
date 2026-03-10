// src/components/Home/CommunityHub.tsx
import { useMemo } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

// ✅ on réutilise ta card + le hook existant (déjà utilisé dans Communautes.tsx)
import CommunityCard, {
  type CommunityCardData,
} from "@shared/components/cards/CommunityCard";
import { useCommunautesExplore } from "@features/community/public/modules/communities/communautes/Communautes.hooks";

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
    <div className="relative group perspective-[1000px] h-full w-full">
      {/* Edge glow on hover */}
      <div className="absolute -inset-1 rounded-[26px] blur-xl bg-fm-primary/0 group-hover:bg-fm-primary/10 transition-colors duration-700 pointer-events-none" aria-hidden />

      {/* bloc cliquable */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className="relative overflow-hidden rounded-[24px] bg-[#070A1A]/80 border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-2xl h-full min-h-[220px] flex flex-col p-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fm-primary/60 transition-transform duration-500 hover:-translate-y-1"
      >
        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[fm-shimmer_2s_ease-in-out_infinite]" />
        </div>

        {/* Top: Logo & Stats Wireframe */}
        <div className="flex items-start justify-between relative z-10 w-full mb-6">
          <div className="h-14 w-14 rounded-2xl bg-white/5 animate-pulse border border-white/5 shadow-inner" />
          <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse border border-white/5" />
        </div>

        {/* Middle: Text Wireframes */}
        <div className="relative z-10 w-full flex-1 mb-4">
          <div className="h-5 w-3/4 rounded-md bg-white/5 animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Bottom: Members & Action Wireframe */}
        <div className="mt-auto flex items-center justify-between relative z-10 w-full pt-4 border-t border-white/5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-6 h-6 rounded-full bg-white/5 animate-pulse border-2 border-[#070A1A]`} style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <div className="h-2 w-16 rounded-full bg-white/5 animate-pulse" />
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
