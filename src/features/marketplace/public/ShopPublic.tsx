// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\ShopPublic.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, SortAsc, SortDesc, ArrowLeft } from "lucide-react";
import {
  getPublicShop,
  listProductsOfPublicShop,
  getPreviewProduct,
  type PublicProductLite,
  type PublicShop,
} from "@features/marketplace/lib/publicShopApi";
import { ProductCardPublic, RatingBadge } from "@shared/components/cards";
import ShopReviewsPanel from "./components/reviews/ShopReviewsPanel";

type SortKey = "title_asc" | "price_asc" | "price_desc";
type WithRating = PublicProductLite & { rating?: number };
type TabKey = "products" | "reviews";

const bool = (v: unknown) => (typeof v === "boolean" ? v : !!v);

export default function ShopPublic() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<PublicShop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  const [products, setProducts] = useState<PublicProductLite[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [active, setActive] = useState<TabKey>("products");

  // UI — produits
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("title_asc");

  // Lightbox couverture
  const [coverOpen, setCoverOpen] = useState(false);

  /* ------------------ Chargement boutique + produits ------------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingShop(true);
      setLoadingProducts(true);

      try {
        const s = slugOrId ? await getPublicShop(slugOrId) : null;
        if (!alive) return;
        setShop(s);

        if (!s) {
          if (alive) setProducts([]);
          return;
        }

        const rows = await listProductsOfPublicShop(slugOrId!);
        if (!alive) return;

        let next = rows.map((p) =>
          typeof (p as { badgeEligible?: unknown }).badgeEligible ===
          "undefined"
            ? { ...p, badgeEligible: undefined }
            : {
                ...p,
                badgeEligible: bool(
                  (p as { badgeEligible?: unknown }).badgeEligible
                ),
              }
        );

        setProducts(next);

        const missing = next.filter((p) => p.badgeEligible === undefined);
        if (missing.length > 0) {
          const settled = await Promise.allSettled(
            missing.map((p) => getPreviewProduct(p.id))
          );
          if (!alive) return;

          const byId = new Map(
            settled
              .filter(
                (
                  r
                ): r is PromiseFulfilledResult<
                  Awaited<ReturnType<typeof getPreviewProduct>>
                > => r.status === "fulfilled"
              )
              .map((r) => [r.value.id, r.value])
          );

          next = next.map((p) => {
            if (p.badgeEligible !== undefined) return p;
            const d = byId.get(p.id);
            return d
              ? { ...p, badgeEligible: bool(d.badgeEligible) }
              : { ...p, badgeEligible: false };
          });

          setProducts(next);
        }
      } finally {
        if (alive) {
          setLoadingShop(false);
          setLoadingProducts(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [slugOrId]);

  /* ----------------------- Hero chips ----------------------- */
  const chips: string[] = useMemo(() => {
    const arr: string[] = [];
    if (shop?.stats?.products != null) {
      arr.push(
        `${shop.stats.products} produit${shop.stats.products > 1 ? "s" : ""}`
      );
    }
    if (shop?.stats?.ratingCount != null) {
      arr.push(`${shop.stats.ratingCount} avis`);
    }
    if (shop?.signature) arr.push(shop.signature);
    return arr;
  }, [shop]);

  /* ----------------------- Filtre + tri produits ----------------------- */
  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows = !needle
      ? products
      : products.filter(
          (p) =>
            p.title.toLowerCase().includes(needle) ||
            (p.shortDescription ?? "").toLowerCase().includes(needle)
        );
    rows = [...rows];
    switch (sort) {
      case "title_asc":
        rows.sort((a, b) => a.title.localeCompare(b.title, "fr"));
        break;
      case "price_asc":
        rows.sort((a, b) => a.pricing.amount - b.pricing.amount);
        break;
      case "price_desc":
        rows.sort((a, b) => b.pricing.amount - a.pricing.amount);
        break;
    }
    return rows;
  }, [products, query, sort]);

  if (loadingShop) return <SkeletonScreen />;

  if (!shop) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-6 py-6">
        <div className="mb-4">
          {/* Bouton retour même si boutique introuvable */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-neutral-900/70 px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </button>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6">
          Boutique introuvable.
        </div>
      </div>
    );
  }

  const cover = shop.coverUrl;
  const avatar = shop.avatarUrl;
  const ratingAvg = shop.stats?.ratingAvg ?? 0;
  const ratingCount = shop.stats?.ratingCount ?? 0;

  const handleAddToCart = (p: PublicProductLite) =>
    console.log("addToCart", p.id);
  const handleToggleFavorite = (p: PublicProductLite, liked: boolean) =>
    console.log("favorite", p.id, liked);
  const handleBuyNow = (p: PublicProductLite) => console.log("buyNow", p.id);

  return (
    <div className="bg-neutral-50/50 dark:bg-[#0a0a0a] min-h-screen pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* BOUTON RETOUR */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>

        {/* SHOP HERO CARD */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5 relative animate-in fade-in zoom-in-[0.98] duration-700 ease-out">
          
          {/* Cover */}
          <div 
            className="w-full h-32 sm:h-40 md:h-48 lg:h-56 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 ring-1 ring-black/5 dark:ring-white/5 relative cursor-zoom-in group"
            onClick={() => cover && setCoverOpen(true)}
            title={cover ? "Cliquer pour agrandir la couverture" : undefined}
          >
            {cover ? (
              <img src={cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="Couverture de la boutique" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/20 group-hover:scale-105 transition-transform duration-700 ease-out" />
            )}
          </div>

          {/* Profil Info Layout */}
          <div className="relative mt-4 sm:mt-6 lg:mt-8 px-2 sm:px-4 lg:px-6 flex flex-col md:flex-row gap-5 md:gap-8 items-start">
            
            {/* Avatar */}
            <div className="shrink-0 -mt-12 sm:-mt-16 relative z-10 hidden md:block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[2rem] overflow-hidden p-[5px] sm:p-1.5 bg-white dark:bg-neutral-900 shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-3xl font-bold text-neutral-400">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    shop.name.slice(0,2).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            {/* Avatar Mobile (Overlap center slightly) */}
            <div className="shrink-0 -mt-12 sm:-mt-14 relative z-10 block md:hidden self-start animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden p-1 bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:-translate-y-1 transition-transform">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-xl sm:text-2xl font-bold text-neutral-400">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    shop.name.slice(0,2).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    {shop.name}
                  </h1>
                  <div className="mt-1 sm:mt-2 text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    {shop.signature || "Boutique certifiée"}
                  </div>
                </div>
                
                <div className="flex shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl ring-1 ring-black/5 dark:ring-white/5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <RatingBadge rating={ratingAvg} count={ratingCount} />
                  </div>
                </div>
              </div>

              {shop.desc && (
                <p className="mt-4 sm:mt-5 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
                  {shop.desc}
                </p>
              )}

              {chips.length > 0 && (
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
                  {chips.map((c, i) => (
                    <span 
                      key={c} 
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 animate-in fade-in slide-in-from-left-2 fill-mode-both"
                      style={{ animationDuration: '500ms', animationDelay: `${400 + (i * 100)}ms` }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABS & SEARCH SECTION */}
        <div className="mt-8 lg:mt-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            
            {/* TABS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActive("products")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active === "products"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/5"
                }`}
              >
                Produits <span className="ml-1 opacity-70">({products.length})</span>
              </button>
              <button
                onClick={() => setActive("reviews")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active === "reviews"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/5"
                }`}
              >
                Avis <span className="ml-1 opacity-70">({ratingCount})</span>
              </button>
            </div>

            {/* SEARCH & SORT (Seulement si tab = produits) */}
            {active === "products" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative group flex-1 sm:w-64">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="h-10 w-full rounded-xl pl-9 pr-4 text-sm bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 outline-none focus:ring-2 focus:ring-violet-500/30 transition shadow-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-violet-500 transition-colors" />
                </div>

                <div className="relative group sm:w-48">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-10 w-full rounded-xl px-4 pr-10 text-sm font-medium bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 outline-none focus:ring-2 focus:ring-violet-500/30 shadow-sm appearance-none transition cursor-pointer"
                  >
                    <option value="title_asc">Titre A → Z</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                  {sort === "price_desc" ? (
                    <SortDesc className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  ) : (
                    <SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TAB CONTENT */}
          {active === "products" ? (
            <div className="animate-in fade-in duration-500">
              {loadingProducts ? (
                <ProductsSkeleton count={6} />
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 p-12 text-center flex flex-col items-center">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                    <Search className="size-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium">Aucun produit ne correspond à votre recherche.</p>
                  <button onClick={() => setQuery("")} className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white hover:underline transition">Réinitialiser la recherche</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCardPublic
                      key={p.id}
                      product={p}
                      rating={(p as WithRating).rating}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={handleToggleFavorite}
                      onBuyNow={handleBuyNow}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {/* Le ReviewsPanel aura le même fond global et ne jurera pas */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 lg:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                <ShopReviewsPanel slugOrId={slugOrId!} />
              </div>
            </div>
          )}
        </div>
      </div>

      {coverOpen && cover && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm px-4 py-8 overflow-y-auto flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setCoverOpen(false)}
        >
          <div
            className="relative mx-auto w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setCoverOpen(false)}
                className="inline-flex items-center justify-center size-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all"
                title="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <img
              src={cover}
              alt={`${shop.name} – couverture agrandie`}
              className="w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------- Sub-components ----------------------- */
function SkeletonScreen() {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-5">
      <div className="relative h-72 w-full overflow-hidden rounded-3xl">
        <div className="h-full w-full animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40" />
      </div>
      <div className="mt-4 flex items-start gap-4">
        <div className="h-20 w-20 rounded-2xl animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-1/3 rounded animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40" />
          <div className="h-4 w-2/3 rounded animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40" />
          <div className="h-4 w-40 rounded animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40" />
        </div>
      </div>
      <ProductsSkeleton count={6} />
    </div>
  );
}

function ProductsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-white/70 dark:bg-neutral-900/60 ring-1 ring-black/10 dark:ring-white/10"
        >
          <div className="aspect-[16/10] animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded" />
            <div className="h-3 w-full animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded" />
            <div className="h-3 w-2/3 animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
