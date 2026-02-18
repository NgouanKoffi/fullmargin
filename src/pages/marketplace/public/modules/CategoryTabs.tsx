// src/pages/marketplace/public/modules/CategoryTabs.tsx
import { useEffect, useState } from "react";
import { Store, Grid3x3, Package, Sparkles } from "lucide-react";
import type { CategoryKey } from "../types";
import { listPublicCategories } from "../../lib/publicShopApi";

type CatItem = { key: string; label: string };

type Props = {
  selected: CategoryKey;
  onSelect: (key: CategoryKey) => void;
};

export default function CategoryTabs({ selected, onSelect }: Props) {
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
      className="
        /* Styles déplacés dans le wrapper sticky parent pour l'UX */
      "
    >
      <div
        className="
          flex items-center gap-2
          overflow-x-auto md:overflow-visible md:flex-wrap
          scrollbar-hide md:scrollbar-default
          w-full
        "
      >
        {/* Boutiques */}
        <TabItem
          label="Boutiques"
          icon={<Store className="w-4 h-4" />}
          active={selected === "boutiques"}
          onClick={() => onSelect("boutiques")}
        />

        {/* Tous produits */}
        <TabItem
          label="Tous produits"
          icon={<Grid3x3 className="w-4 h-4" />}
          active={selected === "all"}
          onClick={() => onSelect("all")}
        />

        {/* Mis en avant */}
        <TabItem
          label="Produits mis en avant"
          icon={<Sparkles className="w-4 h-4 text-amber-500" />}
          active={selected === "featured"}
          onClick={() => onSelect("featured")}
        />

        {/* Séparateur visuel léger */}
        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Catégories dynamiques */}
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="
                  h-9 w-20 rounded-full
                  bg-neutral-200/70 dark:bg-neutral-800/60
                  animate-pulse flex-shrink-0
                "
              />
            ))
          : cats.map((c) => (
              <TabItem
                key={c.key}
                label={c.label || c.key}
                icon={<Package className="w-4 h-4" />}
                active={selected === (c.key as CategoryKey)}
                onClick={() => onSelect(c.key as CategoryKey)}
              />
            ))}
      </div>
    </nav>
  );
}

function TabItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-3.5 py-2
        rounded-full text-sm font-medium
        whitespace-nowrap
        flex-shrink-0
        transition-colors shadow-sm
        ${
          active
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-white/90 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-100 ring-1 ring-black/10 dark:ring-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        }
      `}
      aria-pressed={active}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
