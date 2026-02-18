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
import fmLogo from "../../assets/images/favicon.webp";

// ✅ on réutilise la card publique + l’API publique
import ProductCardPublic from "../../pages/marketplace/public/components/ProductCardPublic";
import {
  getPreviewProduct,
  type PublicProductLite,
} from "../../pages/marketplace/lib/publicShopApi";

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
    <div className="relative">
      {/* glow */}
      <div
        className="absolute -inset-4 rounded-[24px] blur-2xl bg-fm-primary/6 dark:bg-fm-primary/4 pointer-events-none"
        aria-hidden
      />
      {/* bloc cliquable */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className="relative block cursor-pointer rounded-2xl ring-1 ring-skin-border/15 bg-skin-surface/40 dark:bg-skin-surface/10 backdrop-blur-sm h-[260px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/60"
      >
        {/* shimmer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[fm-shimmer_1.8s_linear_infinite]" />
        </div>

        {/* haut : image fake */}
        <div className="h-[110px] bg-skin-inset/50 rounded-t-2xl flex items-center justify-center relative">
          <div className="h-14 w-14 rounded-full bg-skin-surface/60 dark:bg-black/30 ring-1 ring-white/10 flex items-center justify-center shadow-md">
            <img
              src={fmLogo}
              alt="FullMargin"
              className="h-9 w-9 object-contain drop-shadow"
            />
          </div>
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-[10px] text-white">
            Bientôt
          </span>
        </div>

        {/* bas : texte */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-3 h-[150px]">
          <div className="space-y-1">
            <div className="h-3.5 w-40 rounded-full bg-skin-border/20" />
            <div className="h-2.5 w-28 rounded-full bg-skin-border/10" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-28 rounded-full bg-skin-border/10" />
            <div className="h-2 w-32 rounded-full bg-skin-border/10" />
            <div className="h-2 w-20 rounded-full bg-skin-border/10" />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-[11px] text-skin-muted">
              Marketplace en préparation…
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-fm-primary/90">
              Voir plus <ArrowRight className="w-3 h-3" />
            </span>
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
                className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-fm-primary text-skin-primary-foreground text-sm font-semibold shadow-md hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/70"
              >
                Voir le marketplace
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* bloc droite (4 points) */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <li className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-fm-primary/15 text-fm-primary grid place-items-center">
                  <BrainCircuit className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold text-skin-base">
                    Pour améliorer et optimiser ton trading.
                  </p>
                  <p className="text-skin-muted text-sm">
                    Pour améliorer ton trading.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-fm-primary/15 text-fm-primary grid place-items-center">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold text-skin-base">
                    Robots & automatisation
                  </p>
                  <p className="text-skin-muted text-sm">
                    Les meilleurs robots de trading pour MT4/MT5
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-fm-primary/15 text-fm-primary grid place-items-center">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold text-skin-base">
                    Monétisation créateurs
                  </p>
                  <p className="text-skin-muted text-sm">
                    Ouvrez votre propre boutique et vendez vos propres produits.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-fm-primary/15 text-fm-primary grid place-items-center">
                  <Server className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold text-skin-base">
                    VPS & ressources
                  </p>
                  <p className="text-skin-muted text-sm">
                    Pour faire tourner vos robots et stratégies 24h/24.
                  </p>
                </div>
              </li>
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
