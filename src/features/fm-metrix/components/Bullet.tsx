// src/features/fm-metrix/components/Bullet.tsx
import type React from "react";
import { Check } from "lucide-react";

export default function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 group/bullet">
      {/* Conteneur de l'icône avec effet de brillance */}
      <span className="relative flex-shrink-0 mt-0.5">
        {/* Icône Check avec gradient et ombre */}
        <span
          className="
            flex h-6 w-6 items-center justify-center rounded-full
            bg-gradient-to-br from-violet-500 to-violet-600
            shadow-[0_4px_14px_rgba(123,97,255,0.3)]
            ring-2 ring-violet-400/30
            transition-all duration-300
            group-hover/bullet:scale-110
            group-hover/bullet:shadow-[0_6px_18px_rgba(123,97,255,0.45)]
            group-hover/bullet:ring-violet-400/50
            group-hover/bullet:from-violet-400 group-hover/bullet:to-violet-500
          "
        >
          <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
        </span>

        {/* Effet de brillance animé au hover */}
        <span
          className="
            absolute inset-0 rounded-full
            bg-gradient-to-r from-transparent via-white/50 to-transparent
            opacity-0 group-hover/bullet:opacity-100
            transition-opacity duration-300
            pointer-events-none
          "
        />
      </span>

      {/* Texte avec transition de couleur */}
      <span className="text-zinc-900/80 dark:text-white/85 leading-relaxed transition-colors duration-200 group-hover/bullet:text-zinc-900 dark:group-hover/bullet:text-white">
        {children}
      </span>
    </li>
  );
}
