// src/features/fm-metrix/sections/FeatureGrid2x2.tsx
import { ArrowRight, Zap } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import Backtest1Webm from "@assets/gif/converted/Backtest 1.webm";
import Backtest1Mp4 from "@assets/gif/converted/Backtest 1.mp4";
import Backtest2Webm from "@assets/gif/converted/Backtest 2.webm";
import Backtest2Mp4 from "@assets/gif/converted/Backtest 2.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function FeatureGrid2x2({ goToFM, isLoading }: Props) {
  return (
    <section
      id="fmmetrix-features"
      className="py-24 relative overflow-hidden bg-zinc-50 dark:bg-black transition-colors duration-500"
    >
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/5 dark:bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 relative z-10">
        {/* Section Header */}
        <FadeIn className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 text-zinc-900 dark:text-white transition-colors">
            Des{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              fonctionnalités uniques
            </span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto text-xl leading-relaxed transition-colors">
            Conçu pour les traders exigeants, Full Metrix combine rapidité
            d'exécution et profondeur d'analyse.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Backtest — large card */}
          <FadeIn
            direction="left"
            className={`${contentCard} md:col-span-8 group`}
          >
            <div className="flex flex-col lg:flex-row gap-12 items-center h-full">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-6 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                  <Zap className="h-3 w-3" />
                  Performance
                </div>
                <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white transition-colors">
                  Mode{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
                    BACKTEST
                  </span>{" "}
                  Pro
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                  Testez vos stratégies en temps réel avec notre moteur de replay
                  ultra-précis.{" "}
                  <span className="text-violet-600 dark:text-violet-400 font-medium whitespace-nowrap">
                    Forex et Indice synthétique.
                  </span>
                </p>
                <ul className="space-y-3 mb-10 inline-block text-left text-zinc-700 dark:text-zinc-300">
                  <Bullet>Mode replay des indices synthétiques</Bullet>
                  <Bullet>Indicateurs de nouvelle génération</Bullet>
                  <Bullet>Rapports de performance détaillés</Bullet>
                </ul>
                <div>
                  <button
                    type="button"
                    onClick={goToFM}
                    disabled={isLoading}
                    className={`${primaryBtn} group shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300`}
                  >
                    {isLoading ? "Connexion…" : "Découvrir l'outil"}
                    {!isLoading ? (
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    )}
                  </button>
                </div>
              </div>
              <div className="w-full relative z-10 mt-8 lg:mt-0 lg:ml-8 transition-transform duration-500 hover:scale-[1.02] shadow-2xl">
                <WindowFrame className="w-full">
                  <LoopVideo
                    webm={Backtest1Webm}
                    mp4={Backtest1Mp4}
                    label="Mode Backtest"
                    className="w-full h-auto object-cover"
                  />
                </WindowFrame>
              </div>
            </div>
          </FadeIn>

          {/* Stratégies Assistées — small card */}
          <FadeIn
            direction="right"
            delay={0.1}
            className={`${contentCard} md:col-span-4 flex flex-col justify-between group`}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500 mb-6">
                <Zap className="h-3 w-3" />
                Avancé
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white transition-colors">
                Stratégies{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600 dark:from-fuchsia-400 dark:to-pink-400">
                  Avancées
                </span>
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 transition-colors">
                L'IA analyse le Price Action en temps réel pour suggérer les
                zones de haute probabilité.
              </p>
            </div>
            <div className="space-y-3 mb-8 text-zinc-700 dark:text-zinc-300">
              <Bullet>Analyse par IA poussée</Bullet>
              <Bullet>Zones d'offre &amp; demande</Bullet>
              <Bullet>Intégration d'algorithmes exclusifs</Bullet>
            </div>
            <div className="mx-auto max-w-[90%] transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame>
                <LoopVideo
                  webm={Backtest2Webm}
                  mp4={Backtest2Mp4}
                  label="Stratégies Assistées"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
