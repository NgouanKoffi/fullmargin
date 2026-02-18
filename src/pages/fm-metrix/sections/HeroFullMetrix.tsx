// src/pages/fm-metrix/sections/HeroFullMetrix.tsx
import { ArrowRight, Play } from "lucide-react";
import { primaryBtn, secondaryBtn } from "../ui/styles";

import TopWhite from "../../../assets/fmmetrix/Haut de page blanc.webp";
import TopDark from "../../../assets/fmmetrix/Haut de page noir.webp";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function HeroFullMetrix({ goToFM, isLoading }: Props) {
  return (
    <section className="relative w-full bg-white dark:bg-black">
      <div className="relative h-[540px] md:h-[660px] lg:h-[760px] overflow-hidden">
        <img
          src={TopWhite}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-[center_top] dark:hidden"
        />
        <img
          src={TopDark}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-[center_top] hidden dark:block"
        />

        <div className="absolute inset-0 pointer-events-none">
          <div
            className="
              pointer-events-auto
              absolute bottom-10
              left-1/2 -translate-x-1/2
              w-[calc(100%-32px)] max-w-[720px]
              md:bottom-14 md:left-auto md:translate-x-0 md:right-10
              lg:bottom-16 lg:right-14
            "
          >
            <div className="mx-auto w-full max-w-[660px] text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight uppercase text-[#4b3f86] dark:text-white">
                FULL METRIX
              </h1>

              <p className="mt-4 w-full rounded-xl bg-white/35 px-6 py-2.5 backdrop-blur-sm text-xl md:text-2xl text-zinc-700 dark:bg-black/25 dark:text-white/90">
                Le cockpit intelligent du trader moderne
              </p>

              <p className="mt-6 w-full rounded-xl bg-white/28 px-6 py-3 backdrop-blur-sm text-base md:text-lg leading-relaxed text-zinc-600 dark:bg-black/20 dark:text-white/85">
                Backtesting, Chat IA, Agent IA, Journal automatique……
                <br />
                Ton espace professionnel alimenté par l’IA pour passer au niveau
                supérieur..
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-end">
              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className={primaryBtn}
              >
                {isLoading ? "Connexion…" : "Accéder à Full Metrix"}
                {!isLoading ? (
                  <ArrowRight className="h-5 w-5" />
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("fmmetrix-features");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={secondaryBtn}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/5 ring-1 ring-zinc-200/70 dark:bg-white/10 dark:ring-white/15">
                  <Play className="h-4 w-4" />
                </span>
                Voir comment ça fonctionne
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
