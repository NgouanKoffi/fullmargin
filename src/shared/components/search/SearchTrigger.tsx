// src/components/Search/SearchTrigger.tsx
import { Search } from "lucide-react";

/** 
 * Un bouton "Rechercher" réutilisable.
 * - variant="tile" => tuile (liste mobile)
 * - variant="icon" => bouton rond (header desktop)
 */
type Props = {
  variant?: "tile" | "icon";
  className?: string;
  onOpen?: () => void;
};

export default function SearchTrigger({ variant = "tile", className = "", onOpen }: Props) {
  const open = () => {
    onOpen?.();
    window.dispatchEvent(new CustomEvent("fm:open-search"));
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Rechercher"
        title="Rechercher (Ctrl/⌘ K)"
        className={[
          "inline-flex items-center justify-center w-9 h-9 rounded-full",
          "ring-1 ring-skin-border/15 supports-[backdrop-filter]:bg-skin-header/40 bg-skin-header/60 backdrop-blur-md",
          "text-skin-base hover:bg-skin-header/55 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring",
          className,
        ].join(" ")}
      >
        <Search className="w-4.5 h-4.5" />
      </button>
    );
  }

  // Tuile (mobile drawer)
  return (
    <button
      type="button"
      onClick={open}
      className={[
        "w-full text-left rounded-2xl px-4 py-3 text-sm",
        "bg-white/85 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15",
        "ring-1 ring-black/5 dark:ring-white/10 transition-colors",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className="
            inline-flex items-center justify-center
            w-8 h-8 rounded-full
            bg-white/80 dark:bg-white/10
            ring-1 ring-black/5 dark:ring-white/10
            shrink-0
          "
        >
          <Search className="w-4 h-4" />
        </span>
        <span className="truncate text-skin-base">Rechercher…</span>
        <span className="ml-auto hidden sm:inline text-xs text-skin-muted">/ ou Ctrl/⌘ K</span>
      </div>
    </button>
  );
}