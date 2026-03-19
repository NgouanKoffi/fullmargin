// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\ProductsGrid.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { ProductCardPublic } from "@shared/components/cards";
import type { PublicProductLite } from "@features/marketplace/lib/publicShopApi";
import { API_BASE } from "@core/api/client";

const ITEMS_PER_PAGE = 24;

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
  certifiedOnly,
}: {
  categoryKey?: string;
  certifiedOnly?: boolean;
}) {
  const [items, setItems] = useState<PublicProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const min = toInt(params.get("min"));
  const max = toInt(params.get("max"));
  const ratingMin = toInt(params.get("rating"));
  const sort = params.get("sort") || "relevance";
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
        qs.set("page", String(page));

        if (q) qs.set("q", q);
        if (categoryKey && categoryKey !== "boutiques") {
          qs.set("category", categoryKey);
        }

        // On demande au serveur de filtrer (peut ne pas marcher selon l'API)
        if (certifiedOnly) {
          qs.set("badgeEligible", "1");
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
        const fetchedTotal = json?.data?.total ?? json?.total ?? 0;
        const raw = Array.isArray(json?.data?.items) ? json.data.items : [];

        let normalized = raw
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
  }, [q, categoryKey, min, max, ratingMin, sort, page, certifiedOnly]);

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

  // On affiche le message "Aucun produit" si la liste filtrée est vide
  if (items.length === 0) {
    const hasFilters =
      [min, max, ratingMin].some((v) => v !== undefined) ||
      sort !== "relevance";

    // Message spécifique si on est dans la catégorie certifiés
    if (certifiedOnly && !loading && !err) {
      return (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6 text-sm">
          Aucun produit certifié trouvé pour le moment.
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6 text-sm">
        Aucun produit trouvé{q ? ` pour « ${q} »` : ""}
        {hasFilters ? " avec ces filtres" : ""}.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((p) => (
          <ProductCardPublic key={p.id} product={p} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("page", String(p));
              return next;
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}

// --- SOUS-COMPOSANT PAGINATION ---
// (Identique à votre version précédente, je l'inclus pour complétude)

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  // Logique d'affichage des numéros de page (inchangée)
  const getPageNumbers = () => {
    const delta = 2;
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
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : getPageNumbers();

  // Styles boutons (inchangés)
  const btnClass =
    "min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all border";
  const activeClass =
    "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md";
  const inactiveClass =
    "bg-white text-slate-700 border-black/10 hover:bg-slate-50 dark:bg-neutral-900 dark:text-slate-300 dark:border-white/10 dark:hover:bg-neutral-800";

  // Rendu pagination (inchangé)
  // ... (Code SVG ChevronLeft/Right standard)
  const ChevronLeft = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
  const ChevronRight = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );

  return (
    <div className="flex justify-center items-center gap-2 pt-4">
      {currentPage > 1 ? (
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`${btnClass} ${inactiveClass} w-10`}
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      ) : (
        <span
          className={`${btnClass} ${inactiveClass} w-10 opacity-50 cursor-not-allowed`}
        >
          <ChevronLeft className="w-5 h-5" />
        </span>
      )}

      <div className="flex items-center gap-1 md:gap-2">
        {pages.map((p, idx) => {
          if (p === "...")
            return (
              <span key={`dots-${idx}`} className="px-2 text-neutral-400">
                ...
              </span>
            );
          const pageNum = Number(p);
          if (pageNum === currentPage)
            return (
              <span key={pageNum} className={`${btnClass} ${activeClass}`}>
                {pageNum}
              </span>
            );
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`${btnClass} ${inactiveClass}`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`${btnClass} ${inactiveClass} w-10`}
          aria-label="Page suivante"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      ) : (
        <span
          className={`${btnClass} ${inactiveClass} w-10 opacity-50 cursor-not-allowed`}
        >
          <ChevronRight className="w-5 h-5" />
        </span>
      )}
    </div>
  );
}
