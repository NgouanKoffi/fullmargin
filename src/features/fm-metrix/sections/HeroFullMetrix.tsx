// src/features/fm-metrix/sections/HeroFullMetrix.tsx
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { secondaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

import TopWhite from "@assets/fmmetrix/Haut de page blanc.webp";
import TopDark from "@assets/fmmetrix/Haut de page noir.webp";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function HeroFullMetrix({ goToFM, isLoading }: Props) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-20 overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-500">
      {/* Background Image — adapts to theme */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/60 via-white to-white dark:from-violet-900/40 dark:via-zinc-950 dark:to-zinc-950 z-10 transition-colors duration-500" />
        <img
          src={TopWhite}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-[center_top] dark:hidden opacity-60"
        />
        <img
          src={TopDark}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-[center_top] hidden dark:block opacity-80"
        />

        {/* Nebulas / Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-20 transition-colors duration-500" />
      </div>

      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT: Hero image */}
          <div className="flex justify-center lg:justify-start relative">
            <div className="relative w-full max-w-[500px] aspect-square">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-500/20 dark:bg-violet-500/30 rounded-full blur-[80px]" />
              <FadeIn delay={0} direction="right" className="relative w-full h-full">
                <img
                  src={TopWhite}
                  alt="Full Metrix"
                  draggable={false}
                  className="relative w-full h-full object-contain drop-shadow-[0_0_50px_rgba(124,58,237,0.3)] dark:drop-shadow-[0_0_50px_rgba(139,92,246,0.4)] dark:hidden"
                />
                <img
                  src={TopDark}
                  alt="Full Metrix"
                  draggable={false}
                  className="relative w-full h-full object-contain drop-shadow-[0_0_50px_rgba(139,92,246,0.4)] hidden dark:block"
                />
              </FadeIn>
            </div>
          </div>

          {/* RIGHT: Text content */}
          <div className="text-center lg:text-left">
            <FadeIn delay={0.2} direction="left">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 drop-shadow-xl dark:drop-shadow-2xl transition-colors duration-300">
                FULL{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-white bg-clip-text text-transparent">
                  METRIX
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3} direction="left">
              <h2 className="text-2xl md:text-3xl font-medium text-zinc-700 dark:text-zinc-100 mb-8 tracking-wide transition-colors duration-300">
                Le cockpit intelligent du trader moderne
              </h2>
            </FadeIn>

            <FadeIn delay={0.4} direction="left">
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-light transition-colors duration-300">
                Backtesting, Chat IA, Agent IA, Journal automatique…
                <br />
                <span className="font-medium text-violet-700 dark:text-violet-300">
                  Ton espace professionnel alimenté par l'IA
                </span>{" "}
                pour passer au niveau supérieur.
              </p>
            </FadeIn>

            <FadeIn delay={0.5} direction="up">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={goToFM}
                  disabled={isLoading}
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] shadow-lg"
                >
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span>
                    {isLoading ? "Connexion…" : "Accéder à Full Metrix"}
                  </span>
                  {isLoading && (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                  {!isLoading && (
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("fmmetrix-features");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`${secondaryBtn} backdrop-blur-sm`}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">
                    <Play className="h-4 w-4 ml-0.5" />
                  </span>
                  Voir comment ça fonctionne
                </button>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
}
