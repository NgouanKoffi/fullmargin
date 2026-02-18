// src/pages/marketplace/tabs/ProductsTab.tsx
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import AddProductForm from "./products/AddProductForm";
import ProductList from "./products/ProductList";

import { useMyProducts } from "../lib/useMyProducts";
import type { ProductLite } from "../lib/productApi";

import {
  listPublicShopReviews,
  publicProductUrl,
  type ShopReview,
} from "../lib/publicShopApi";

/* ---------------- Types & helpers ---------------- */

export type StatusFilter =
  | "all"
  | "published"
  | "pending"
  | "rejected"
  | "suspended"
  | "draft";

export type TypeFilter =
  | "all"
  | "robot_trading"
  | "indicator"
  | "ebook_pdf"
  | "template_excel";

function isProductLite(v: unknown): v is ProductLite {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const hasStr = (k: string) => typeof o[k] === "string";
  const hasPricing =
    typeof o.pricing === "object" &&
    o.pricing !== null &&
    typeof (o.pricing as Record<string, unknown>).amount === "number" &&
    typeof (o.pricing as Record<string, unknown>).mode === "string";

  return (
    hasStr("id") &&
    hasStr("title") &&
    typeof o.shortDescription === "string" &&
    hasStr("status") &&
    hasStr("type") &&
    hasPricing
  );
}

/* ---------------- Component ---------------- */

export default function ProductsTab() {
  const [tab, setTab] = useState<"list" | "add" | "reviews">("list");
  const { loading, items, refresh } = useMyProducts();

  const [editId, setEditId] = useState<string | null>(null);

  // Filtres (onglet Liste)
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [ptype, setPtype] = useState<TypeFilter>("all");

  const safeItems: ProductLite[] = useMemo(
    () => (Array.isArray(items) ? items.filter(isProductLite) : []),
    [items]
  );

  const filtered = useMemo(() => {
    let rows = safeItems;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }
    if (status !== "all") rows = rows.filter((p) => p.status === status);
    if (ptype !== "all") rows = rows.filter((p) => p.type === ptype);
    return rows;
  }, [safeItems, query, status, ptype]);

  const filtersDisabled = loading;

  /* ---------------- Avis ---------------- */
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [qReviews, setQReviews] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const myShopId = useMemo(() => {
    const ids = Array.from(
      new Set(
        (Array.isArray(items) ? items : [])
          .map((it) =>
            typeof it === "object" && it && "shop" in (it as object)
              ? String((it as ProductLite & { shop?: unknown }).shop || "")
              : ""
          )
          .filter((v): v is string => !!v)
      )
    );
    return ids[0] || "";
  }, [items]);

  useEffect(() => {
    if (tab !== "reviews") return;
    let alive = true;
    (async () => {
      try {
        setLoadingReviews(true);
        setReviews([]);
        if (!myShopId) return;
        const rows = await listPublicShopReviews(myShopId);
        if (!alive) return;
        setReviews(rows);
      } finally {
        if (alive) setLoadingReviews(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab, myShopId]);

  const filteredReviews = useMemo(() => {
    const q = qReviews.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;

    return reviews.filter((r) => {
      const okText = !q
        ? true
        : r.productTitle.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          (r.comment || "").toLowerCase().includes(q);
      const d = r.createdAt ? new Date(r.createdAt) : null;
      const okFrom = from ? (d ? d >= from : false) : true;
      const okTo = to ? (d ? d <= to : false) : true;
      return okText && okFrom && okTo;
    });
  }, [reviews, qReviews, fromDate, toDate]);

  /* ---------------- Render ---------------- */

  return (
    // coupe tout débordement horizontal parasite
    <div className="w-full max-w-full overflow-x-clip">
      <h2 className="text-xl font-bold mb-3">Produits</h2>

      {/* Tabs - scroll horizontal sur mobile */}
      <div className="overflow-x-auto -mb-px">
        <div className="flex min-w-max items-center gap-1 sm:gap-2 border-b border-black/10 dark:border-white/10 mb-4 px-1">
          <TabBtn
            active={tab === "list"}
            onClick={() => {
              setTab("list");
              setEditId(null);
            }}
          >
            Liste
          </TabBtn>
          <TabBtn active={tab === "add"} onClick={() => setTab("add")}>
            {editId ? "Modifier" : "Ajouter"}
          </TabBtn>
          <TabBtn
            active={tab === "reviews"}
            onClick={() => {
              setTab("reviews");
              setEditId(null);
            }}
          >
            Avis
          </TabBtn>
        </div>
      </div>

      {tab === "list" ? (
        <>
          {/* ====== FILTRES LISTE — wrap garanti jusqu'à xl (>=1280 = 1 ligne) ====== */}
          <div
            className="mb-5 grid grid-cols-12 gap-3 items-end"
            aria-busy={filtersDisabled}
          >
            {/* Recherche : 12 (mobile→lg), 6 (xl) */}
            <div className="col-span-12 xl:col-span-6 min-w-0">
              <label
                htmlFor="products-search"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Recherche
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-4 h-4 opacity-60" />
                </span>
                <input
                  id="products-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher par titre ou description…"
                  disabled={filtersDisabled}
                  className={`w-full min-w-0 h-11 xl:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/60 ${
                    filtersDisabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            {/* Statut : 12 (mobile), 6 (sm), 3 (xl) */}
            <div className="col-span-12 sm:col-span-6 xl:col-span-3 min-w-0">
              <label
                htmlFor="products-status"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Statut
              </label>
              <select
                id="products-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                disabled={filtersDisabled}
                className={`w-full min-w-0 h-11 xl:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 text-sm ${
                  filtersDisabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="all">Tous</option>
                <option value="published">Publiés</option>
                <option value="pending">En attente</option>
                <option value="rejected">Refusés</option>
                <option value="suspended">Suspendus</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>

            {/* Type : 12 (mobile), 6 (sm), 3 (xl) */}
            <div className="col-span-12 sm:col-span-6 xl:col-span-3 min-w-0">
              <label
                htmlFor="products-type"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Type
              </label>
              <select
                id="products-type"
                value={ptype}
                onChange={(e) => setPtype(e.target.value as TypeFilter)}
                disabled={filtersDisabled}
                className={`w-full min-w-0 h-11 xl:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 text-sm ${
                  filtersDisabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="all">Tous</option>
                <option value="robot_trading">Robot de trading</option>
                <option value="indicator">Indicateur</option>
                <option value="ebook_pdf">E-book / PDF / Livre</option>
                <option value="template_excel">Template / Outil Excel</option>
              </select>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : (
            <ProductList
              items={filtered}
              onEdit={(id) => {
                setEditId(id);
                setTab("add");
              }}
              onAfterDelete={() => refresh()}
            />
          )}
        </>
      ) : tab === "add" ? (
        <AddProductForm
          editId={editId ?? undefined}
          onCancelEdit={() => {
            setEditId(null);
            setTab("list");
          }}
          onSaved={async () => {
            await refresh();
            setEditId(null);
            setTab("list");
          }}
        />
      ) : (
        /* ================== Onglet AVIS — CARTES (pas de tableau) ================== */
        <div className="mt-3 space-y-4">
          {/* Filtres AVIS — wrap clair : md = 2 lignes, xl = 1 ligne */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-2 min-w-0">
              <label
                htmlFor="rev-from"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Du
              </label>
              <input
                id="rev-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full min-w-0 h-11 md:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 text-sm appearance-none"
              />
            </div>

            <div className="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-2 min-w-0">
              <label
                htmlFor="rev-to"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Au
              </label>
              <input
                id="rev-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full min-w-0 h-11 md:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-3 text-sm appearance-none"
              />
            </div>

            <div className="col-span-12 md:col-span-12 xl:col-span-8 min-w-0">
              <label
                htmlFor="rev-search"
                className="block text-xs font-medium opacity-70 mb-1"
              >
                Recherche
              </label>
              <div className="relative">
                <input
                  id="rev-search"
                  value={qReviews}
                  onChange={(e) => setQReviews(e.target.value)}
                  placeholder="Rechercher dans les avis…"
                  className="h-11 md:h-10 w-full min-w-0 rounded-xl pl-9 pr-3 text-sm bg-white/80 dark:bg-neutral-900/60 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="text-sm opacity-70">
            {loadingReviews
              ? "Chargement…"
              : `${filteredReviews.length} au total`}
          </div>

          {/* Cartes responsives (1 → 2 → 3 colonnes) */}
          {loadingReviews ? (
            <ReviewsCardsSkeleton count={3} />
          ) : filteredReviews.length === 0 ? (
            <div className="text-sm opacity-70">
              Aucun avis pour ces critères.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReviews.map((r, i) => (
                <article
                  key={`${r.productId}_${r.userId}_${i}_card`}
                  className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-neutral-900/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <a
                      href={publicProductUrl(r.productId)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100 dark:bg-neutral-800 shrink-0"
                    >
                      {r.productImageUrl ? (
                        <img
                          src={r.productImageUrl}
                          alt={r.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </a>
                    <div className="min-w-0">
                      <a
                        href={publicProductUrl(r.productId)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline truncate block"
                        title={r.productTitle}
                      >
                        {r.productTitle}
                      </a>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Stars value={r.rating} />
                          <span className="font-semibold text-yellow-500">
                            {r.rating.toFixed(1)}/5
                          </span>
                        </span>
                        <span className="opacity-70 hidden sm:inline">•</span>
                        <span className="opacity-80">
                          {fmtDate(r.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-5 break-words">
                    {r.comment || "—"}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="font-medium truncate">{r.userName}</div>
                    {/* place pour actions si besoin */}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "text-violet-600 dark:text-violet-400"
          : "opacity-80 hover:opacity-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <span
        className={`absolute left-0 right-0 -bottom-px h-[2px] transition-all ${
          active ? "bg-violet-600 dark:bg-violet-400" : "bg-transparent"
        }`}
      />
    </button>
  );
}

/* ====== Skeletons ====== */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 dark:bg-neutral-700/40 ${className}`}
    />
  );
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
      aria-busy
    >
      {items.map((_, i) => (
        <article
          key={i}
          className="overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60"
        >
          <Skeleton className="aspect-[16/9]" />
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 w-full">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded mt-2" />
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------- Helpers ---------- */
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d
      .toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return iso || "—";
  }
}

/** Étoiles (support demi) */
function Stars({ value = 0, size = 14 }: { value?: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const percent = Math.round((v - full) * 100);
  return (
    <span className="inline-flex items-center" aria-label={`${v} sur 5`}>
      <span className="relative inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={`bg-${i}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="text-neutral-400/70 dark:text-neutral-500/70"
          >
            <path
              d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
              fill="currentColor"
            />
          </svg>
        ))}
        <span className="absolute inset-0 flex overflow-hidden pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => {
            const fill = i < full ? 100 : i === full ? percent : 0;
            return (
              <span
                key={`fg-${i}`}
                className="relative"
                style={{ width: size }}
              >
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill}%` }}
                >
                  <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    className="text-yellow-400"
                  >
                    <path
                      d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

/** Skeleton cartes d’avis */
function ReviewsCardsSkeleton({ count = 3 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      aria-busy
    >
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-neutral-900/60 p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded mt-2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded mt-3" />
          <Skeleton className="h-3 w-5/6 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}
