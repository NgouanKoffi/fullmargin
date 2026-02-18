// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\components\TabItem.tsx
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  /** Affiche seulement l’icône (texte en sr-only pour l’accessibilité) */
  compact?: boolean;
  /** Le bouton prend toute la largeur disponible */
  fullWidth?: boolean;
};

export default function TabItem({
  icon,
  label,
  active = false,
  onClick,
  compact = false,
  fullWidth = false,
}: Props) {
  const clickable = typeof onClick === "function";

  // layout : compact = version “chip” (mobile), sinon gros bouton (sidebar)
  const layoutClasses = compact
    ? "inline-flex items-center h-9 gap-2 px-3"
    : "flex items-center h-11 gap-2 px-3";

  const widthClasses = fullWidth || !compact ? "w-full" : "w-auto";

  const base =
    "rounded-2xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950";

  const stateClasses = active
    ? // actif : violet dans les deux thèmes
      "bg-violet-600 text-white shadow-sm"
    : clickable
    ? // normal : clair en light, sombre en dark
      "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800/90"
    : // désactivé (lock) : atténué
      "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed dark:bg-slate-900/40 dark:text-slate-500";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`${base} ${layoutClasses} ${widthClasses} ${stateClasses}`}
      aria-current={active ? "page" : undefined}
    >
      {/* Icône */}
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-700 dark:bg-black/40 dark:text-slate-100">
        {icon}
      </span>

      {/* Label : caché seulement en mode compact (icône-only pour mobile) */}
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
    </button>
  );
}
