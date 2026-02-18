import { Moon, Sun } from "lucide-react";
import * as React from "react";

type Props = {
  checked: boolean;
  onCheckedChange: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export const Switch = ({ checked, onCheckedChange, className = "" }: Props) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Passer en mode clair" : "Passer en mode sombre"}
      title={checked ? "Mode sombre activé" : "Mode clair activé"}
      onClick={onCheckedChange}
      className={[
        "relative inline-flex items-center h-7 w-14 rounded-full",
        "transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        checked ? "bg-indigo-600" : "bg-gray-300 dark:bg-white/15",
        "ring-1 ring-black/10 dark:ring-white/10",
        className,
      ].join(" ")}
    >
      {/* Icônes “fantômes” sur la piste (gauche=soleil, droite=lune) */}
      <span
        className={[
          "pointer-events-none absolute left-1.5 transition-opacity",
          checked ? "opacity-40" : "opacity-80",
        ].join(" ")}
      >
        <Sun className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
      </span>
      <span
        className={[
          "pointer-events-none absolute right-1.5 transition-opacity",
          checked ? "opacity-80" : "opacity-40",
        ].join(" ")}
      >
        <Moon className="w-3.5 h-3.5 text-white/90 drop-shadow" />
      </span>

      {/* Thumb */}
      <span
        className={[
          "z-10 inline-flex items-center justify-center",
          "h-6 w-6 rounded-full bg-white shadow-md",
          "transform transition-transform duration-300",
          checked ? "translate-x-7" : "translate-x-1",
        ].join(" ")}
      >
        {checked ? (
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};
