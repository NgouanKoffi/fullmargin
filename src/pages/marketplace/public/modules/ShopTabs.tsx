// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\ShopTabs.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import ShopCard from "./ShopCard";
import { listPublicShops, type PublicShop } from "../../lib/publicShopApi";

export default function ShopTabs() {
  const [rows, setRows] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim().toLowerCase();

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const data = await listPublicShops();
      setRows(data);
    } catch {
      setErr("Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const data = await listPublicShops();
        if (alive) setRows(data);
      } catch {
        if (alive) setErr("Chargement impossible");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.desc ?? "").toLowerCase().includes(q)
    );
  }, [rows, q]);

  return (
    <div className="mt-4">
      {/* Titre + actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base md:text-lg font-semibold">Boutiques</h3>
          <p className="text-xs md:text-sm opacity-70">
            {loading ? "Chargement en cours…" : `${filtered.length} au total`}
          </p>
        </div>

        {/* Outils: uniquement Recharger */}
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 h-9 rounded-xl px-3 text-sm font-medium bg-neutral-900 text-white ring-1 ring-white/10 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            title="Recharger la liste"
          >
            <RefreshCcw className="w-4 h-4" />
            Recharger
          </button>
        </div>
      </div>

      {/* États */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white/70 dark:bg-neutral-900/60"
            >
              <div className="aspect-[16/9] animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50" />
              <div className="p-4">
                <div className="h-4 w-2/3 animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded-md" />
                <div className="mt-2 h-3 w-full animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded-md" />
                <div className="mt-2 h-3 w-5/6 animate-pulse bg-neutral-200/70 dark:bg-neutral-800/50 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{err}</span>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm md:text-base opacity-70">
          Aucune boutique trouvée.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <ShopCard
              key={s.id}
              id={s.id}
              slug={s.slug}
              name={s.name}
              desc={s.desc}
              cover={s.coverUrl}
              avatar={s.avatarUrl}
              products={s.stats?.products ?? 0}
              ratingAvg={s.stats?.ratingAvg ?? 0}
              ratingCount={s.stats?.ratingCount ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
