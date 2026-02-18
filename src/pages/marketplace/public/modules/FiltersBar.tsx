// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\FiltersBar.tsx
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  X,
  ChevronRight,
  Sparkles,
  ArrowDownAZ,
} from "lucide-react";

function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b);
}
function toInt(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

export default function FiltersBar() {
  const [params, setParams] = useSearchParams();

  // lecture URL -> état local
  const min0 = toInt(params.get("min"));
  const max0 = toInt(params.get("max"));
  const rating0 = toInt(params.get("rating"));
  const sort0 = params.get("sort") || "relevance";

  const [min, setMin] = useState<string>(min0?.toString() ?? "");
  const [max, setMax] = useState<string>(max0?.toString() ?? "");
  const [rating, setRating] = useState<string>(rating0?.toString() ?? "");
  const [sort, setSort] = useState<string>(sort0);

  // sync back/forward
  useEffect(() => {
    const m = toInt(params.get("min"));
    const M = toInt(params.get("max"));
    const r = toInt(params.get("rating"));
    const s = params.get("sort") || "relevance";
    setMin(m?.toString() ?? "");
    setMax(M?.toString() ?? "");
    setRating(r?.toString() ?? "");
    setSort(s);
  }, [params]);

  const apply = useCallback(() => {
    const next = new URLSearchParams(params);
    const m = min.trim();
    const M = max.trim();
    const r = rating.trim();

    if (m && Number(m) >= 0) next.set("min", Math.floor(Number(m)).toString());
    else next.delete("min");

    if (M && Number(M) >= 0) next.set("max", Math.floor(Number(M)).toString());
    else next.delete("max");

    const rNum = Number(r);
    if (r && rNum >= 1 && rNum <= 5)
      next.set("rating", clamp(rNum, 1, 5).toString());
    else next.delete("rating");

    if (sort && sort !== "relevance") next.set("sort", sort);
    else next.delete("sort");

    setParams(next);
  }, [min, max, rating, sort, params, setParams]);

  const clear = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("min");
    next.delete("max");
    next.delete("rating");
    next.delete("sort");
    setParams(next);
  }, [params, setParams]);

  const chips = useMemo(() => {
    const out: string[] = [];
    const m = toInt(params.get("min"));
    const M = toInt(params.get("max"));
    const r = toInt(params.get("rating"));
    const s = params.get("sort");
    if (m !== undefined) out.push(`Min ${m} $`);
    if (M !== undefined) out.push(`Max ${M} $`);
    if (r !== undefined) out.push(`${r}★ et +`);
    if (s && s !== "relevance") {
      out.push(
        s === "price_asc"
          ? "Prix ↑"
          : s === "price_desc"
          ? "Prix ↓"
          : s === "rating_desc"
          ? "Mieux notés"
          : ""
      );
    }
    return out.filter(Boolean);
  }, [params]);

  // ==== Drawer (slide from right) ====
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openAndFocus = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // ===== UI =====
  return (
    <>
      {/* Barre d'outils Desktop (Inline) */}
      <div className="hidden md:block mt-3">
        <div
          className="
            p-1.5 flex flex-wrap items-center gap-4
            bg-white/60 dark:bg-neutral-900/60 rounded-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm
            shadow-sm
          "
        >
          {/* Prix */}
          <div className="flex items-center gap-2 pl-2">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Prix</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                placeholder="Min"
                className="w-16 h-8 text-sm px-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
              />
              <span className="text-neutral-400">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                className="w-16 h-8 text-sm px-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
              />
            </div>
          </div>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10" />

          {/* Note */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Note</span>
            <select
              className="h-8 text-sm px-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">Peu importe</option>
              <option value="4">4★ et +</option>
              <option value="3">3★ et +</option>
              <option value="2">2★ et +</option>
            </select>
          </div>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10" />

          {/* Tri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Trier par</span>
            <select
              className="h-8 text-sm px-2 rounded-lg bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
              value={sort}
              onChange={(e) => {
                 setSort(e.target.value);
                 // On peut vouloir appliquer le tri immédiatement, mais `apply` utilise les autres états aussi
                 // Pour l'instant, l'utilisateur doit cliquer sur "Filtrer" ou on pourrait auto-apply via un useEffect dédié si on voulait
              }}
            >
              <option value="relevance">Pertinence</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating_desc">Mieux notés</option>
            </select>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
             {(min || max || rating || sort !== "relevance") && (
                <button
                  onClick={clear}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  Effacer
                </button>
             )}
             <button
               onClick={apply}
               className="
                 h-8 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                 text-xs font-bold uppercase tracking-wide
                 hover:shadow-md hover:scale-105 transition-all
               "
             >
               Filtrer
             </button>
          </div>

        </div>
      </div>

      {/* Portal for Fixed elements (FAB + Drawer) to escape stacking contexts (backdrop-blur) */}
      {createPortal(
        <>
          {/* FAB mobile (toujours visible en bas à droite) */}
          <button
            type="button"
            onClick={openAndFocus}
            className="
              fixed right-4 bottom-4 z-20 md:hidden
              inline-flex items-center justify-center w-12 h-12 rounded-full
              bg-neutral-900 text-white ring-1 ring-white/10 shadow-lg
            "
            aria-label="Filtres"
            title="Filtres"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Overlay */}
          <div
            aria-hidden={!open}
            onClick={close}
            className={`fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${
              open
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Drawer (droite) */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Filtres"
            className={`
              fixed inset-y-0 right-0 z-[70] w-[360px] max-w-[95vw]
              transform transition-transform duration-300 ease-out
              bg-white dark:bg-neutral-950 border-l border-black/10 dark:border-white/10 shadow-xl
              ${open ? "translate-x-0" : "translate-x-full"}
              md:hidden
            ` + (open ? "" : " invisible")}
            tabIndex={-1}
            ref={panelRef}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white w-8 h-8 text-[13px] font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="text-base font-semibold">Filtres</div>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Fermer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du panneau */}
            <div className="p-4 space-y-4">
              {/* Bloc Prix */}
              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Prix</h4>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <span className="opacity-70">Min</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="h-9 w-28 rounded-xl px-2 text-sm
                        bg-white/80 dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                      placeholder="0"
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm">
                    <span className="opacity-70">Max</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="h-9 w-28 rounded-xl px-2 text-sm
                        bg-white/80 dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      placeholder="—"
                    />
                  </label>
                </div>
              </section>

              {/* Bloc Note */}
              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Note minimale</h4>
                <select
                  className="h-9 rounded-xl px-2 text-sm
                    bg-white/80 dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="">Toutes</option>
                  <option value="4">4★ et plus</option>
                  <option value="3">3★ et plus</option>
                  <option value="2">2★ et plus</option>
                  <option value="1">1★ et plus</option>
                </select>
              </section>

              {/* Bloc Tri */}
              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Trier</h4>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="h-9 rounded-xl px-2 text-sm
                      bg-white/80 dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="rating_desc">Mieux notés</option>
                  </select>
                  <div className="text-[11px] opacity-70 inline-flex items-center gap-1">
                    <ArrowDownAZ className="w-3.5 h-3.5" />
                    Utilise le tri + la note pour les produits “les plus
                    populaires”.
                  </div>
                </div>
              </section>
            </div>

            {/* Footer d’actions */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  clear();
                  // panneau reste ouvert
                }}
                className="h-9 rounded-xl px-3 text-sm font-medium ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/50"
                title="Effacer"
              >
                Effacer
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    apply();
                    setOpen(false);
                  }}
                  className="h-9 rounded-xl px-3 text-sm font-semibold bg-neutral-900 text-white ring-1 ring-white/10 hover:bg-black"
                  title="Appliquer"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
}
