// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\ProductsGrid.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"; // Ajout des icones
import ProductCardPublic from "../components/ProductCardPublic";
import type { PublicProductLite } from "../../lib/publicShopApi";
import { API_BASE } from "../../../../lib/api";

const ITEMS_PER_PAGE = 24;

/** Normalisation douce pour fiabiliser les types reçus du back */
function normalizeItem(u: unknown): PublicProductLite | null {
  if (typeof u !== "object" || u === null) return null;
  const r = u as Record<string, unknown>;

  const id = String(r.id ?? r._id ?? "");
  if (!id) return null;

  const typeRaw = String(r.type ?? "");
  const allowed = new Set([
    "robot_trading",
    "indicator",
    "mt4_mt5",
    "ebook_pdf",
    "template_excel",
  ]);
  const type = (
    allowed.has(typeRaw) ? typeRaw : "ebook_pdf"
  ) as PublicProductLite["type"];

  const pricingIn = r.pricing as Record<string, unknown> | undefined;
  const mode = pricingIn?.mode === "subscription" ? "subscription" : "one_time";
  const amount = Number(pricingIn?.amount ?? 0);
  const pricing: PublicProductLite["pricing"] =
    mode === "subscription"
      ? {
          mode,
          amount,
          interval: pricingIn?.interval === "year" ? "year" : "month",
        }
      : { mode, amount };

  return {
    id,
    title: typeof r.title === "string" ? r.title : "",
    shortDescription:
      typeof r.shortDescription === "string" ? r.shortDescription : "",
    type,
    imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : undefined,
    pricing,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
    ratingAvg:
      typeof (r as { ratingAvg?: unknown }).ratingAvg === "number"
        ? (r as { ratingAvg: number }).ratingAvg
        : undefined,
    ratingCount:
      typeof (r as { ratingCount?: unknown }).ratingCount === "number"
        ? (r as { ratingCount: number }).ratingCount
        : undefined,
    badgeEligible: !!(r as { badgeEligible?: unknown }).badgeEligible,
    shop: ((): PublicProductLite["shop"] => {
      const s = r.shop as Record<string, unknown> | undefined;
      if (!s) return null;
      const sid = String(s.id ?? s._id ?? "");
      const name = typeof s.name === "string" ? s.name : "";
      const slug = typeof s.slug === "string" ? s.slug : undefined;
      const avatarUrl =
        typeof s.avatarUrl === "string" ? s.avatarUrl : undefined;
      if (!sid && !name && !slug) return null;
      return { id: sid, name, slug, avatarUrl };
    })(),
  };
}

function toInt(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

export default function ProductsGrid({
  categoryKey,
  featuredOnly,
}: {
  categoryKey?: string;
  featuredOnly?: boolean;
}) {
  const [items, setItems] = useState<PublicProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // NOUVEAU: État pour le total
  const [totalItems, setTotalItems] = useState(0);

  const [params, setParams] = useSearchParams(); // On récupère setParams pour changer la page
  const q = (params.get("q") || "").trim();

  // Filtres URL
  const min = toInt(params.get("min"));
  const max = toInt(params.get("max"));
  const ratingMin = toInt(params.get("rating"));
  const sort = params.get("sort") || "relevance";

  // NOUVEAU: Page actuelle (défaut 1)
  const page = Math.max(1, toInt(params.get("page")) || 1);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const qs = new URLSearchParams();
        qs.set("limit", String(ITEMS_PER_PAGE));
        // NOUVEAU: Ajout de la page dans la requête
        qs.set("page", String(page));

        if (q) qs.set("q", q);
        if (categoryKey && categoryKey !== "boutiques") {
          qs.set("category", categoryKey);
        }
        if (featuredOnly) {
          qs.set("featuredOnly", "1");
        }
        if (min !== undefined) qs.set("min", String(min));
        if (max !== undefined) qs.set("max", String(max));
        if (ratingMin !== undefined) qs.set("minRating", String(ratingMin));
        if (sort && sort !== "relevance") qs.set("sort", sort);

        const res = await fetch(
          `${API_BASE}/marketplace/public/products?${qs.toString()}`,
          {
            cache: "no-store",
            signal: ctrl.signal,
          },
        );

        if (!res.ok) {
          if (alive) {
            setErr(`HTTP ${res.status}`);
            setItems([]);
            setTotalItems(0);
          }
          return;
        }

        const json = await res.json();

        // NOUVEAU: Extraction du total
        // On suppose que l'API renvoie { data: { items: [], total: 100 } } ou similaire
        // Adaptez "json?.data?.total" selon votre réponse réelle backend
        const fetchedTotal = json?.data?.total ?? json?.total ?? 0;

        const raw = Array.isArray(json?.data?.items) ? json.data.items : [];
        const normalized = raw
          .map(normalizeItem)
          .filter(Boolean) as PublicProductLite[];

        if (alive) {
          setItems(normalized);
          setTotalItems(fetchedTotal);
        }
      } catch (e) {
        if (alive && !(e instanceof DOMException && e.name === "AbortError")) {
          console.error("[ProductsGrid] fetch failed:", e);
          setErr("Chargement impossible");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [q, categoryKey, min, max, ratingMin, sort, page]); // Ajout de 'page' aux dépendances



  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-2xl animate-pulse bg-neutral-200/70 dark:bg-neutral-700/40"
          />
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span>{err}</span>
      </div>
    );
  }

  if (items.length === 0) {
    const label =
      [min, max, ratingMin].some((v) => v !== undefined) || sort !== "relevance"
        ? " avec ces filtres"
        : "";
    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6 text-sm">
        Aucun produit trouvé{q ? ` pour « ${q} »` : ""}
        {label}.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* GRILLE PRODUITS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((p) => (
          <ProductCardPublic key={p.id} product={p} />
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          getPageUrl={(p) => {
            const next = new URLSearchParams(params);
            next.set("page", String(p));
            return `?${next.toString()}`;
          }}
        />
      )}
    </div>
  );
}

// --- SOUS-COMPOSANT PAGINATION ---

import { Link } from "react-router-dom";

function Pagination({
  currentPage,
  totalPages,
  getPageUrl,
}: {
  currentPage: number;
  totalPages: number;
  getPageUrl: (p: number) => string;
}) {
  // Générer les numéros de page à afficher (ex: 1, 2, ..., 10)
  const getPageNumbers = () => {
    const delta = 2; // Nombre de pages autour de la courante
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) rangeWithDots.push("...");
    if (range.length > 0) rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) rangeWithDots.push("...");

    return [1, ...rangeWithDots, totalPages];
  };

  const pages =
    totalPages <= 1
      ? []
      : totalPages <= 7
        ? Array.from({ length: totalPages }, (_, i) => i + 1) // Si peu de pages, on affiche tout
        : getPageNumbers();

  const btnClass = "min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all border";
  const activeClass = "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md";
  const inactiveClass = "bg-white text-slate-700 border-black/10 hover:bg-slate-50 dark:bg-neutral-900 dark:text-slate-300 dark:border-white/10 dark:hover:bg-neutral-800";

  return (
    <div className="flex justify-center items-center gap-2 pt-4">
      {/* Précédent */}
      {currentPage > 1 ? (
        <Link
          to={getPageUrl(Math.max(1, currentPage - 1))}
          className={`${btnClass} ${inactiveClass} w-10`}
          aria-label="Page précédente"
          preventScrollReset={false}
          onClick={() => window.scrollTo(0, 0)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      ) : (
        <span className={`${btnClass} ${inactiveClass} w-10 opacity-50 cursor-not-allowed`}>
          <ChevronLeft className="w-5 h-5" />
        </span>
      )}

      {/* Numéros */}
      <div className="flex items-center gap-1 md:gap-2">
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} className="px-2 text-neutral-400">
                ...
              </span>
            );
          }
          const pageNum = Number(p);
          const isActive = pageNum === currentPage;
          
          if (isActive) {
             return (
               <span key={pageNum} className={`${btnClass} ${activeClass}`}>
                  {pageNum}
               </span>
             );
          }

          return (
            <Link
              key={pageNum}
              to={getPageUrl(pageNum)}
              className={`${btnClass} ${inactiveClass}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Suivant */}
      {currentPage < totalPages ? (
        <Link
          to={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`${btnClass} ${inactiveClass} w-10`}
          aria-label="Page suivante"
          onClick={() => window.scrollTo(0, 0)}
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <span className={`${btnClass} ${inactiveClass} w-10 opacity-50 cursor-not-allowed`}>
          <ChevronRight className="w-5 h-5" />
        </span>
      )}
    </div>
  );
}
