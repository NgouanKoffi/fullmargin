// src/pages/communaute/public/components/FilterBar.tsx
import { Pill } from "./ui";

type Props = {
  categories: string[];
  selected: string[];
  onToggle: (cat: string) => void;
  onClearAll?: () => void;
  loading?: boolean;
  className?: string;
};

function PillSkeleton() {
  return (
    <span className="inline-block h-8 w-24 rounded-full bg-slate-200/70 dark:bg-slate-700/50 animate-pulse" />
  );
}

export default function FilterBar({
  categories,
  selected,
  onToggle,
  onClearAll,
  loading = false,
  className = "",
}: Props) {
  if (loading) {
    return (
      <div
        className={`mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-px-2 ${className}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PillSkeleton key={i} />
        ))}
      </div>
    );
  }

  const hasSelection = selected.length > 0;

  return (
    <div
      className={`mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-px-2 ${className}`}
    >
      {/* Bouton "Toutes" */}
      <button
        type="button"
        className="shrink-0"
        onClick={() => onClearAll?.()}
        aria-pressed={!hasSelection}
      >
        <Pill active={!hasSelection}>Toutes</Pill>
      </button>

      {categories.map((c) => {
        const active = selected.includes(c);
        return (
          <button
            key={c}
            type="button"
            onClick={() => onToggle(c)}
            className="shrink-0"
            aria-pressed={active}
            title={c}
          >
            <Pill active={active}>{humanizeCategory(c)}</Pill>
          </button>
        );
      })}
    </div>
  );
}

/** Affichage plus clean si les catégories viennent en snake_case/kebab-case */
function humanizeCategory(v: string): string {
  const s = (v || "").toString().trim();
  if (!s) return "Autre";
  return s
    .replace(/[-_]+/g, " ") // ✅ plus d’échappement inutile
    .replace(/\s+/g, " ")
    .replace(/^\s|\s$/g, "")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
