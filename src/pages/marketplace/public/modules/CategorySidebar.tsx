// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\CategorySidebar.tsx
import { useEffect, useState } from "react";
import { Store, Package, Grid3x3 } from "lucide-react";
import type { CategoryKey } from "../types";
import { listPublicCategories } from "../../lib/publicShopApi";

type CatItem = { key: string; label: string };

export default function CategorySidebar({
  selected,
  onSelect,
}: {
  selected: CategoryKey;
  onSelect: (key: CategoryKey) => void;
}) {
  const [cats, setCats] = useState<CatItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const rows = await listPublicCategories();
        if (alive) setCats(rows);
      } catch {
        if (alive) setCats([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <nav
      aria-label="Catégories"
      className="sticky top-4 space-y-3 rounded-2xl p-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60"
    >
      <h3 className="text-sm font-semibold px-2 pt-1">Catégories</h3>

      <ul className="flex flex-col gap-1.5">
        <Item
          active={selected === "boutiques"}
          icon={<Store className="w-4 h-4" />}
          label="Boutiques"
          onClick={() => onSelect("boutiques")}
        />
        <Item
          active={selected === "all"}
          icon={<Grid3x3 className="w-4 h-4" />}
          label="Tous produits"
          onClick={() => onSelect("all")}
        />

        <li className="mt-2 mb-1 text-[11px] uppercase tracking-wide opacity-60 px-2">
          Produits par catégorie
        </li>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100/70 dark:bg-neutral-800/50 animate-pulse"
            />
          ))
        ) : cats.length === 0 ? (
          <p className="text-xs opacity-70 px-2">Aucune catégorie</p>
        ) : (
          cats.map((c) => (
            <Item
              key={c.key}
              active={selected === c.key}
              icon={<Package className="w-4 h-4" />}
              label={c.label || c.key}
              onClick={() => onSelect(c.key as CategoryKey)}
            />
          ))
        )}
      </ul>
    </nav>
  );
}

function Item({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm ring-1 transition
          ${
            active
              ? "bg-indigo-50/80 dark:bg-indigo-500/10 ring-indigo-300/50 dark:ring-indigo-500/30 text-indigo-700 dark:text-indigo-300"
              : "bg-white/60 dark:bg-neutral-900/60 ring-black/10 dark:ring-white/10 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60"
          }`}
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg ring-1 ring-black/10 dark:ring-white/10">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
}
