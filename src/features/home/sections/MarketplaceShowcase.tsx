// src/components/Home/MarketplaceShowcase.tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  Bot,
  BrainCircuit,
  Server,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ on réutilise la card publique + l’API publique
import { ProductCardPublic } from "@shared/components/cards";
import {
  getPreviewProduct,
  type PublicProductLite,
} from "@features/marketplace/lib/publicShopApi";

/* Produits à afficher sur la Home */
const FEATURED_PRODUCT_IDS = [
  "694050f62d348ab172a36896",
  "690e03333932a296dbf8a57b",
  "690e04b13932a296dbf8a6bc",
  "690dfae33932a296dbf89f3d",
] as const;

const bool = (v: unknown) => (typeof v === "boolean" ? v : !!v);

function MarketplaceLoaderCard({
  onClick,
}: {
  onClick: () => void;
}): ReactElement {
  return (
    <div className="relative group perspective-[1000px] h-full w-full">
      {/* glow */}
      <div className="absolute -inset-1 rounded-[26px] blur-xl bg-fm-primary/0 group-hover:bg-fm-primary/10 transition-colors duration-700 pointer-events-none" aria-hidden />

      {/* bloc cliquable */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className="relative block cursor-pointer rounded-[24px] border border-white/5 bg-[#070A1A]/80 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-2xl h-full min-h-[300px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-fm-primary/60 transition-transform duration-500 hover:-translate-y-1 flex flex-col"
      >
        {/* Shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
          <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[fm-shimmer_2s_ease-in-out_infinite]" />
        </div>

        {/* haut : image fake skeleton */}
        <div className="h-[140px] bg-white/5 relative border-b border-white/5 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent animate-pulse" />
          <div className="h-16 w-16 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
          <div className="absolute top-4 right-4 h-6 w-16 rounded-full bg-white/5 animate-pulse" />
        </div>

        {/* bas : texte wireframes */}
        <div className="flex-1 p-5 flex flex-col gap-4 relative z-10 w-full">
          {/* Titre & Auteur */}
          <div className="space-y-2">
            <div className="h-5 w-4/5 rounded-md bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
          </div>

          {/* Description */}
          <div className="space-y-2 mt-2">
            <div className="h-2 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-2 w-5/6 rounded bg-white/5 animate-pulse" />
          </div>

          {/* Footer stats */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-14 rounded-md bg-white/5 animate-pulse" />
              <div className="h-6 w-14 rounded-md bg-white/5 animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceShowcase(): ReactElement {
  const navigate = useNavigate();

  const [featured, setFeatured] = useState<PublicProductLite[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const goToMarketplace = () => {
    navigate("/marketplace?cat=all");
  };

  // ✅ Fetch des 4 produits par ID
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingFeatured(true);
      try {
        const settled = await Promise.allSettled(
          FEATURED_PRODUCT_IDS.map((id) => getPreviewProduct(id))
        );
        if (!alive) return;

        const ok = settled
          .filter(
            (
              r
            ): r is PromiseFulfilledResult<
              Awaited<ReturnType<typeof getPreviewProduct>>
            > => r.status === "fulfilled"
          )
          .map((r) => r.value)
          .map((p) => ({
            ...(p as PublicProductLite),
            // on normalise au cas où l’API renvoie autre chose
            badgeEligible:
              typeof (p as any).badgeEligible === "undefined"
                ? false
                : bool((p as any).badgeEligible),
          }));

        // on garde l’ordre des ids si possible
        const byId = new Map(ok.map((p) => [p.id, p]));
        const ordered = FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter(
          Boolean
        ) as PublicProductLite[];

        setFeatured(ordered);
      } finally {
        if (alive) setLoadingFeatured(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ Toujours afficher 4 cartes (si certains ids échouent => loaders)
  const missingCount = Math.max(0, 4 - featured.length);
  const fallbackLoaders = useMemo(
    () => Array.from({ length: missingCount }),
    [missingCount]
  );

  return (
    <>
      {/* keyframes shimmer */}
      <style>
        {`
          @keyframes fm-shimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(220%); }
          }
        `}
      </style>

      <section className="w-full">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-16 lg:py-24">
          {/* header */}
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            {/* bloc gauche */}
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-skin-base leading-tight">
                Marketplace Full Margin
              </h2>
              <p className="mt-4 text-skin-muted text-base sm:text-lg leading-relaxed max-w-xl">
                Découvre tous les outils, ressources, robots et ebooks
                disponibles pour toi. Chaque semaine, de nouveaux produits sont
                disponibles.
              </p>

              <button
                type="button"
                onClick={goToMarketplace}
                className="group relative mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 bg-fm-primary text-white text-sm font-semibold shadow-[0_8px_24px_rgba(111,60,255,0.3)] hover:scale-105 hover:shadow-[0_8px_32px_rgba(111,60,255,0.5)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/70 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fm-accent to-fm-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  Voir le marketplace
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>

            {/* bloc droite (4 points) */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {[
                {
                  icon: <BrainCircuit className="w-5 h-5" />,
                  title: "Améliorer & optimiser",
                  desc: "Des outils conçus pour affiner votre trading.",
                },
                {
                  icon: <Bot className="w-5 h-5" />,
                  title: "Robots & automatisation",
                  desc: "Les meilleurs robots MT4/MT5.",
                },
                {
                  icon: <DollarSign className="w-5 h-5" />,
                  title: "Monétisation créateurs",
                  desc: "Ouvrez votre boutique et vendez vos créations.",
                },
                {
                  icon: <Server className="w-5 h-5" />,
                  title: "VPS & ressources",
                  desc: "Faites tourner vos stratégies 24h/24 sans coupure.",
                },
              ].map((feature, idx) => (
                <li
                  key={idx}
                  className="
                    flex items-start gap-4 p-5 rounded-[20px]
                    bg-white/5 dark:bg-[#0A0C18] border border-white/10 dark:border-white/5
                    shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-transform duration-300
                  "
                >
                  <span className="h-10 w-10 shrink-0 rounded-full bg-fm-primary/10 border border-fm-primary/20 text-fm-primary grid place-items-center">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="font-bold text-skin-base tracking-tight mb-1">
                      {feature.title}
                    </p>
                    <p className="text-skin-muted text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* grid produits */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* si loading et rien récupéré => 4 loaders */}
            {loadingFeatured && featured.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <MarketplaceLoaderCard key={idx} onClick={goToMarketplace} />
              ))
            ) : (
              <>
                {featured.map((p) => (
                  <ProductCardPublic key={p.id} product={p} />
                ))}

                {/* si un ou plusieurs produits n’ont pas été trouvés => loaders restants */}
                {fallbackLoaders.map((_, idx) => (
                  <MarketplaceLoaderCard
                    key={`fallback-${idx}`}
                    onClick={goToMarketplace}
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
