// src/pages/marketplace/public/components/reviews/ShopReviewsPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import {
  listPublicShopReviews,
  publicProductUrl,
  type ShopReview,
} from "../../../lib/publicShopApi";

/* ---------- Utils ---------- */
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

/** Étoiles jaunes + affichage x/5 (support demi-étoiles) */
function Stars({
  value = 0,
  size = 16,
  showNumeric = false,
}: {
  value?: number; // 0..5
  size?: number;
  showNumeric?: boolean;
}) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const percent = Math.round((v - full) * 100);

  return (
    <div className="inline-flex items-center gap-2" aria-label={`${v} sur 5`}>
      <div className="relative inline-flex">
        {/* Fond gris */}
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
        {/* Remplissage jaune au-dessus */}
        <div className="absolute inset-0 flex overflow-hidden pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => {
            const fill = i < full ? 100 : i === full ? percent : 0;
            return (
              <div key={`fg-${i}`} className="relative" style={{ width: size }}>
                <div
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showNumeric && (
        <span className="text-[13px] font-semibold text-yellow-500">
          {v.toFixed(1)}/5
        </span>
      )}
    </div>
  );
}

/* ---------- Skeleton ---------- */
function ReviewsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 p-4"
        >
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/50 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-neutral-200/70 dark:bg-neutral-800/50 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-neutral-200/70 dark:bg-neutral-800/50 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-neutral-200/70 dark:bg-neutral-800/50 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===========================================================
   PANEL D’AVIS (réutilisable)
   Props:
   - slugOrId: string (identifiant de la boutique)
   - heading?: string
   - className?: string
   =========================================================== */
export default function ShopReviewsPanel({
  slugOrId,
  heading = "Avis",
  className = "",
}: {
  slugOrId: string;
  heading?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setItems([]);
    (async () => {
      try {
        const rows = await listPublicShopReviews(slugOrId);
        if (!alive) return;
        setItems(rows);
      } catch (e) {
        if (!alive) return;
        console.warn("[ShopReviewsPanel] load error:", e);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slugOrId]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return items;
    return items.filter(
      (r) =>
        r.productTitle.toLowerCase().includes(n) ||
        r.userName.toLowerCase().includes(n) ||
        r.comment.toLowerCase().includes(n)
    );
  }, [items, q]);

  return (
    <section className={`mt-6 md:mt-8 ${className}`}>
      <div className="mb-4 sm:mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg md:text-xl font-semibold">
          {heading}{" "}
          <span className="text-xs font-normal opacity-70">
            {loading ? "Chargement…" : `${filtered.length} au total`}
          </span>
        </h2>

        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher dans les avis…"
            className="h-10 w-72 rounded-xl pl-9 pr-3 text-sm bg-white/80 dark:bg-neutral-900/60 backdrop-blur ring-1 ring-black/10 dark:ring-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <ReviewsSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-6 text-sm opacity-75">
          Aucun avis pour l’instant.
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((r, idx) => (
            <li
              key={`${r.productId}_${r.userId}_${idx}`}
              className="rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-neutral-900/70 p-4"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                  {r.productImageUrl ? (
                    <img
                      src={r.productImageUrl}
                      alt={r.productTitle}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={publicProductUrl(r.productId)}
                      className="text-sm font-semibold hover:underline"
                    >
                      {r.productTitle}
                    </Link>
                    <Stars value={r.rating} size={16} showNumeric />
                  </div>
                  <div className="text-xs opacity-70">
                    par <span className="font-medium">{r.userName}</span> ·{" "}
                    {fmtDate(r.createdAt)}
                  </div>
                  {r.comment && (
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {r.comment}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
