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
} from "../lib/publicShopApi";
import ProductCardPublic from "./components/ProductCardPublic";
import RatingBadge from "./components/RatingBadge";
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
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-5">
      {/* 🔙 BOUTON RETOUR */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-neutral-900/70 px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour</span>
        </button>
      </div>

      {/* HERO (cliquable pour ouvrir le lightbox) */}
      <section
        className="relative h-72 w-full overflow-hidden rounded-3xl ring-1 ring-black/10 dark:ring-white/10 cursor-zoom-in"
        onClick={() => cover && setCoverOpen(true)}
        title={cover ? "Cliquer pour agrandir" : undefined}
      >
        {cover ? (
          <img
            src={cover}
            alt={`${shop.name} – couverture`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

        <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:right-6 md:left-8 md:right-8">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-white/90 bg-white/40 backdrop-blur-sm shrink-0 grid place-items-center text-white/90 text-lg font-semibold">
              {avatar ? (
                <img
                  src={avatar}
                  alt={`${shop.name} avatar`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="tracking-wide">
                  {shop.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? "")
                    .join("") || "FM"}
                </span>
              )}
            </div>

            <div className="min-w-0 text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold truncate drop-shadow-sm">
                  {shop.name}
                </h1>
                <RatingBadge rating={ratingAvg} count={ratingCount} />
              </div>

              {shop.desc ? (
                <p className="mt-1 text-sm md:text-base/5 opacity-95 line-clamp-2">
                  {shop.desc}
                </p>
              ) : null}

              {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="text-[11px] font-medium px-2 py-1 rounded-full bg-white/95 text-neutral-900 ring-1 ring-black/10"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* A PROPOS */}
      <section className="mt-6 md:mt-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 sm:p-5">
        <div className="flex flex-col gap-2 text-[13px] md:text-[14px]">
          <div className="font-medium">À propos</div>
          <div className="opacity-80">
            {shop.desc || "Aucune description fournie."}
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => setActive("products")}
          className={`px-3 py-1.5 rounded-full text-sm ring-1 ring-black/10 dark:ring-white/10 ${
            active === "products"
              ? "bg-violet-600 text-white"
              : "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }`}
        >
          Produits
        </button>
        <button
          onClick={() => setActive("reviews")}
          className={`px-3 py-1.5 rounded-full text-sm ring-1 ring-black/10 dark:ring-white/10 ${
            active === "reviews"
              ? "bg-violet-600 text-white"
              : "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }`}
        >
          Avis
        </button>
      </div>

      {/* CONTENU TABS */}
      {active === "products" ? (
        <section className="mt-6 md:mt-8">
          <div className="mb-4 sm:mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">Produits</h2>
              <p className="text-xs md:text-sm opacity-70">
                {loadingProducts
                  ? "Chargement…"
                  : `${products.length} au total`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="h-10 w-64 rounded-xl pl-9 pr-3 text-sm bg-white/80 dark:bg-neutral-900/60 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 rounded-xl px-3 text-sm font-medium bg-white/80 dark:bg-neutral-900/60 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none pr-8"
                >
                  <option value="title_asc">Titre A → Z</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
                {sort === "price_desc" ? (
                  <SortDesc className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
                ) : (
                  <SortAsc className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
                )}
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <ProductsSkeleton count={6} />
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6 text-sm opacity-75">
              Aucun produit ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </section>
      ) : (
        <ShopReviewsPanel slugOrId={slugOrId!} />
      )}

      {/* LIGHTBOX COUVERTURE */}
      {coverOpen && cover && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          onClick={() => setCoverOpen(false)}
        >
          <div
            className="relative mx-auto w-full max-w-5xl bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setCoverOpen(false)}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-black dark:bg-neutral-800"
              >
                Fermer
              </button>
            </div>

            <div className="px-4 pb-6 sm:px-6">
              <div className="flex justify-center">
                <img
                  src={cover}
                  alt={`${shop.name} – couverture agrandie`}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            </div>
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
