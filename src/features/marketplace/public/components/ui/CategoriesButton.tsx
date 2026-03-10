import { LayoutGrid } from "lucide-react";
import clsx from "clsx";

export type CategoriesButtonProps = {
  onClick?: () => void;
  className?: string;
  /** "solid" = fond coloré, "subtle" = fond neutre */
  variant?: "solid" | "subtle";
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
  title?: string;
  "aria-label"?: string;
};

export default function CategoriesButton({
  onClick,
  className = "",
  variant = "subtle",
  ...a11y
}: CategoriesButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={a11y.title ?? "Catégories"}
      aria-label={a11y["aria-label"] ?? "Catégories"}
      aria-controls={a11y["aria-controls"]}
      aria-expanded={a11y["aria-expanded"]}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-3 py-2 transition",
        "ring-1 ring-black/10 dark:ring-white/10",
        variant === "solid"
          ? "bg-emerald-600/90 hover:bg-emerald-600 text-white"
          : "bg-white/70 dark:bg-neutral-900/60 text-current hover:bg-white dark:hover:bg-neutral-800",
        className
      )}
    >
      {/* Icône toujours visible en light/dark grâce à `currentColor` */}
      <LayoutGrid className="w-5 h-5" />
    </button>
  );
}
