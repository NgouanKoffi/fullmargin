// src/pages/communaute/public/components/ScrollTabs.tsx
import { useEffect, useRef } from "react";
import type React from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { type TabKey } from "../tabs.constants";

const ring = "ring-1 ring-black/5 dark:ring-white/10";

type ScrollTab = {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  locked?: boolean;
  /** nombre de notifications à afficher sur l’onglet (optionnel) */
  notif?: number;
};

export function ScrollTabs({
  tabs,
  active,
  onChange,
  sideSlot,
  rightSlot,
}: {
  tabs: ScrollTab[];
  active: TabKey;
  onChange: (t: TabKey) => void;
  /** petit slot à gauche (ex: icône menu communauté) */
  sideSlot?: React.ReactNode;
  /** slot qui doit défiler avec les onglets (ex: bouton “Créer ma communauté”) */
  rightSlot?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  const scrollBy = (dx: number) =>
    ref.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div className="sticky top-0 z-30 bg-transparent">
      {/* Ligne onglets + slot gauche */}
      <div className="flex items-center gap-2">
        {/* Slot à gauche (ex : bouton Menu communauté) */}
        {sideSlot && (
          <div className="flex-shrink-0 pl-1 sm:pl-0">{sideSlot}</div>
        )}

        {/* Bloc des onglets + bouton à droite, tous scrollables */}
        <div className="relative flex-1 min-w-0">
          {/* Flèches de scroll (desktop) */}
          <button
            type="button"
            aria-label="Défiler vers la gauche"
            onClick={() => scrollBy(-220)}
            className="
              hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2
              items-center justify-center w-7 h-7 rounded-full
              bg-white/85 dark:bg-white/10
              border border-black/5 dark:border-white/10
              backdrop-blur
            "
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Défiler vers la droite"
            onClick={() => scrollBy(220)}
            className="
              hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2
              items-center justify-center w-7 h-7 rounded-full
              bg-white/85 dark:bg-white/10
              border border-black/5 dark:border-white/10
              backdrop-blur
            "
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Liste des onglets + bouton supplément, tous dans la même flex scrollable */}
          <div
            ref={ref}
            className="
              pl-2 pr-2 sm:pl-8 sm:pr-8
              flex flex-nowrap items-center gap-2
              overflow-x-auto no-scrollbar
              py-3 scroll-px-3
            "
          >
            {tabs.map((t) => {
              const isActive = t.key === active;
              const isLocked = t.locked === true;
              const notifCount = typeof t.notif === "number" ? t.notif : 0;

              return (
                <button
                  key={t.key}
                  ref={isActive ? activeRef : undefined}
                  onClick={() => {
                    if (isLocked) return; // 🔒 on ne laisse pas cliquer
                    onChange(t.key);
                  }}
                  type="button"
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${ring} transition-colors
                    ${
                      isActive
                        ? "bg-violet-600 text-white ring-violet-700"
                        : isLocked
                        ? "bg-transparent text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        : "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-skin-base"
                    }`}
                  aria-disabled={isLocked}
                  title={isLocked ? "Cette section est verrouillée" : undefined}
                >
                  {t.icon}

                  <span className="whitespace-nowrap relative flex items-center gap-1">
                    {t.label}

                    {notifCount > 0 && (
                      <span
                        className="
                          ml-1 inline-flex items-center justify-center 
                          min-w-[18px] h-[18px] px-1
                          text-[11px] font-semibold
                          rounded-full 
                          bg-red-600 text-white
                          shadow-sm
                        "
                      >
                        {notifCount}
                      </span>
                    )}
                  </span>

                  {/* cadenas rouge */}
                  {isLocked && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-black/30 ring-1 ring-red-400/70">
                      <Lock className="w-3.5 h-3.5 text-red-500" />
                    </span>
                  )}

                  {/* soulignement onglet actif */}
                  {isActive && !isLocked && (
                    <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full bg-violet-600" />
                  )}
                </button>
              );
            })}

            {/* ➕ bouton “Créer ma communauté” qui défile avec les onglets */}
            {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
