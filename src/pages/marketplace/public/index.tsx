// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\index.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import CategoryDrawer from "./CategoryDrawer";
import type { CategoryKey } from "./types";

import HeaderBrand from "./modules/HeaderBrand";
import SearchBar from "./modules/SearchBar";
import TopActions from "./modules/TopActions";
import SearchModal from "./components/ui/SearchModal";
import CategoryContent from "./modules/CategoryContent";
import FiltersBar from "./modules/FiltersBar";
import CategoryTabs from "./modules/CategoryTabs";

import { useWishlistCount } from "../lib/wishlist";
import { useCartCount } from "../lib/cart";
// On retire useAuth s'il n'est pas utilisé ici directement
// ou on le garde seulement si nécessaire pour d'autres logiques
// import { useAuth } from "../../../auth/AuthContext";

import HeroSlider, { type HeroItem } from "./components/HeroSlider";
import {
  listFeaturedPublicProducts,
  publicProductUrl,
} from "../lib/publicShopApi";

const CAT_LS = "fm:market:pubCat";
const DEFAULT_CAT: CategoryKey = "all";
const normalizeCategory = (raw?: string | null): CategoryKey => {
  const v = (raw || "").trim();
  if (v === "boutiques" || v === "all") return v as CategoryKey;
  return (v || DEFAULT_CAT) as CategoryKey;
};

export default function MarketplacePublic() {
  // 1. On utilise useLocation pour récupérer l'état de navigation (ex: clic sur "Voir tout")
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  // 2. Suppression de `status` qui était inutilisé (erreur ESLint)
  // const { status } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const urlCat = params.get("cat");
  const lsCat =
    (typeof localStorage !== "undefined" && localStorage.getItem(CAT_LS)) ||
    null;
  const category: CategoryKey = useMemo(
    () => normalizeCategory(urlCat || lsCat),
    [urlCat, lsCat],
  );

  useEffect(() => {
    if (!urlCat) {
      const next = new URLSearchParams(params);
      next.set("cat", category);
      setParams(next, { replace: true });
    }
    localStorage.setItem(CAT_LS, category);
  }, [urlCat, category, params, setParams]);

  const setCat = useCallback(
    (next: CategoryKey) => {
      const q = new URLSearchParams(params);
      q.set("cat", normalizeCategory(next));
      q.delete("page"); // Reset page on category change
      setParams(q);
      localStorage.setItem(CAT_LS, normalizeCategory(next));
    },
    [params, setParams],
  );

  // 3. Réintégration de la logique qui utilise 'location' (corrige l'erreur useLocation)
  useEffect(() => {
    const state = location.state as {
      openCategories?: boolean;
      forceCategory?: CategoryKey;
    } | null;

    if (state?.forceCategory) setCat(normalizeCategory(state.forceCategory));
    if (state?.openCategories) setDrawerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // On ne veut l'exécuter qu'au montage

  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  const applySearch = useCallback(
    (query: string, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params);
      const trimmed = query.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      next.delete("page"); // Reset page on search
      setParams(next, { replace: opts?.replace ?? true });
    },
    [params, setParams],
  );

  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [heroLoading, setHeroLoading] = useState<boolean>(true);

  // NOUVEAU: Page actuelle (défaut 1)
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = (params.get("q") || "").trim();

  // Condition d'affichage du Hero : Pas de recherche ET Page 1
  const showHero = !q && page === 1;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setHeroLoading(true);
        const prods = await listFeaturedPublicProducts(8);
        if (!mounted) return;
        setHeroItems(
          prods.map((p) => ({
            id: p.id,
            kicker: p.badgeEligible ? "Certifié" : "Mis en avant",
            title: p.title || "Produit",
            subtitle: p.shortDescription || "",
            imageUrl:
              p.imageUrl ||
              "https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?q=80&w=1200&auto=format&fit=crop",
            cta: "Découvrir",
            href: publicProductUrl(p.id),
          })),
        );
      } catch {
        setHeroItems([]);
      } finally {
        if (mounted) setHeroLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full px-3 sm:px-4 lg:px-8 pb-20 md:pb-28 overflow-x-clip">
      <header className="flex items-center justify-between gap-2 py-3 border-b border-black/5 dark:border-white/10">
        <HeaderBrand />
        <div className="flex-1 md:mx-6 hidden md:block">
          <SearchBar
            placeholder="Rechercher..."
            defaultValue={params.get("q") || ""}
            onChange={(q) => applySearch(q, { replace: true })}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m21 21-4.35-4.35" />
              <circle cx="10" cy="10" r="7" />
            </svg>
          </button>
          <TopActions
            wishlistCount={wishlistCount}
            cartCount={cartCount}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
        </div>
      </header>

      {showHero && heroItems.length > 0 && (
        <div className="mt-4 md:mt-6">
          <HeroSlider items={heroItems} autoplay={!heroLoading} />
        </div>
      )}

      {/* Sticky Category Bar DISABLED (user request) */}
      <div className="mt-4 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-y border-black/5 dark:border-white/5 py-3 transition-all">
        <CategoryTabs selected={category} onSelect={setCat} />
        <FiltersBar />
      </div>

      <section className="mt-5 min-h-[50vh]">
        <CategoryContent category={category} />
      </section>

      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={setCat}
        selected={category}
      />
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSubmit={(q) => applySearch(q)}
      />
    </div>
  );
}
