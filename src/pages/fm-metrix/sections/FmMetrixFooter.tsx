// src/pages/fm-metrix/sections/FmMetrixFooter.tsx
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

import BottomBg from "../../../assets/fmmetrix/Fond de bas de page.webp";
import RobotCutout from "../../../assets/fmmetrix/Fullmetrix bas de page sans fond.png";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FmMetrixFooter({ goToFM, isLoading }: Props) {
  const vars: CSSProperties = {
    ["--padX" as any]: "clamp(12px, 2vw, 44px)",
    ["--robotW" as any]: "clamp(170px, 24vw, 520px)",
    ["--robotCol" as any]: "clamp(120px, 26vw, 560px)",
  };

  return (
    <footer className="w-full overflow-x-hidden bg-white dark:bg-black">
      {/* =======================
          Bloc image (PLEINE LARGEUR, SANS 100vw)
          ======================= */}
      <div className="pt-16 md:pt-20">
        <div className="w-full">
          <div className="relative overflow-visible" style={vars}>
            {/* ✅ arrondi seulement quand le robot est visible (sm+) */}
            <div className="relative w-full overflow-hidden rounded-none sm:rounded-t-[140px] sm:rounded-b-none">
              <div className="relative h-[210px] sm:h-[230px] md:h-[250px] lg:h-[275px]">
                <img
                  src={BottomBg}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 dark:bg-black/30" />

                <div className="relative h-full">
                  <div className="mx-auto h-full max-w-[1600px] px-[var(--padX)]">
                    <div className="flex h-full items-center">
                      <div className="w-full pr-[var(--padX)] sm:pl-[calc(var(--robotCol)+var(--padX))]">
                        <div className="mx-auto sm:ml-auto max-w-[720px]">
                          <h2 className="text-center font-extrabold leading-[1.15] text-white text-[14px] sm:text-[15px] md:text-[18px] lg:text-[20px]">
                            <span className="text-violet-400">
                              FULL METRIX,
                            </span>{" "}
                            votre espace professionnel alimenté par l’IA pour
                            passer au niveau supérieur.
                          </h2>

                          <div className="mt-3 flex justify-center">
                            <button
                              type="button"
                              onClick={goToFM}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center gap-2 rounded-full px-6 md:px-7 py-2.5 text-sm md:text-base font-semibold text-white
                                         bg-violet-600 hover:bg-violet-500 active:scale-[0.98]
                                         shadow-[0_18px_60px_rgba(123,97,255,0.35)]
                                         transition disabled:opacity-70 disabled:cursor-wait"
                            >
                              {isLoading
                                ? "Connexion…"
                                : "Accédez à Full metrix"}
                              {isLoading ? (
                                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                              ) : (
                                <ArrowRight className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Robot: NE DÉBORDE PAS EN BAS (bottom-0), dépasse seulement en HAUT */}
                <img
                  src={RobotCutout}
                  alt="Full Metrix"
                  draggable={false}
                  className="
                    pointer-events-none select-none
                    hidden sm:block
                    absolute left-[var(--padX)] bottom-0
                    z-20
                    w-[var(--robotW)]
                    drop-shadow-[0_26px_90px_rgba(123,97,255,0.45)]
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================
          Barre menus (EN DEHORS)
          ======================= */}
      <div className="bg-black">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm font-semibold text-white/90">
            <a href="/conditions" className="hover:text-white transition">
              Conditions et assistance
            </a>
            <a href="/confidentialite" className="hover:text-white transition">
              Politique de confidentialité
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
