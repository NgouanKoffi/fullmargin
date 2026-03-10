// src/features/fm-metrix/sections/FeatureGrid2x2.tsx
import { ChevronRight, Activity, ShieldCheck } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import Backtest1Webm from "@assets/gif/converted/Backtest 1.webm";
import Backtest1Mp4 from "@assets/gif/converted/Backtest 1.mp4";
import Backtest2Webm from "@assets/gif/converted/Backtest 2.webm";
import Backtest2Mp4 from "@assets/gif/converted/Backtest 2.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function FeatureGrid2x2({ goToFM, isLoading }: Props) {
  return (
    <section id="fmmetrix-features" className="py-16 relative overflow-hidden bg-zinc-50 dark:bg-[#0A0A0A]">
      
      {/* Background ambient lights */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[500px] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[600px] bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 relative z-10">
        
        {/* ROW 1: Mode BACKTEST (Text on Right) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 mb-20">
          
          {/* Left: Video Frame */}
          <FadeIn direction="right" className="w-full lg:w-1/2 order-2 lg:order-1 perspective-[1000px]">
            <div className="relative transform lg:rotate-y-[5deg] transition-transform duration-700 hover:rotate-y-0 group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-violet-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <WindowFrame className="shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-zinc-200 dark:ring-white/10 relative z-10 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <LoopVideo
                  webm={Backtest1Webm}
                  mp4={Backtest1Mp4}
                  label="Mode Backtest"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>
          </FadeIn>

          {/* Right: Text Content */}
          <FadeIn direction="left" delay={0.2} className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col justify-center">
            
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 text-zinc-900 dark:text-white uppercase tracking-tight">
              Mode <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">BACKTEST</span>
            </h3>
            
            <ul className="space-y-5 mb-10">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                  Outils d'analyses
                </span>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                  Mode replay des indices synthétiques et du forex
                </span>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                  Des Indicateurs uniques et performants
                </span>
              </li>
            </ul>

            <button
              onClick={goToFM}
              disabled={isLoading}
              className="group self-start inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg md:text-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1"
            >
              Découvrir <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>
        </div>


        {/* ROW 2: Stratégies Avancés (Text on Left) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left: Text Content */}
          <FadeIn direction="right" delay={0.2} className="w-full lg:w-1/2 flex flex-col justify-center">
            
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 text-zinc-900 dark:text-white uppercase tracking-tight">
              STRATEGIES <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">AVANCÉS</span>
            </h3>
            
            <ul className="space-y-5 mb-10">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                  Analyse par IA avancé
                </span>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                  Stratégies d'analyse technique intégrées
                </span>
              </li>
            </ul>

            <button
              onClick={goToFM}
              disabled={isLoading}
              className="group self-start inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg md:text-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1"
            >
              Découvrir <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>

          {/* Right: Video Frame */}
          <FadeIn direction="left" className="w-full lg:w-1/2 perspective-[1000px]">
            <div className="relative transform lg:rotate-y-[-5deg] transition-transform duration-700 hover:rotate-y-0 group">
              <div className="absolute -inset-4 bg-gradient-to-bl from-fuchsia-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <WindowFrame className="shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-zinc-200 dark:ring-white/10 relative z-10 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <LoopVideo
                  webm={Backtest2Webm}
                  mp4={Backtest2Mp4}
                  label="Stratégies Avancés"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>
          </FadeIn>

        </div>

        {/* ROW 3: Micro Cards (Added back from previous version to fulfill user request) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          
          <FadeIn direction="up" delay={0.3} className="rounded-[2rem] p-8 bg-zinc-900 dark:bg-zinc-800/40 text-white relative overflow-hidden group border border-zinc-800 dark:border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Activity className="h-8 w-8 text-violet-400 mb-5 relative z-10" />
            <h4 className="text-xl font-bold mb-3 relative z-10">Monitoring Précis</h4>
            <p className="text-zinc-400 font-light text-sm leading-relaxed relative z-10">
              Suivi en temps réel de votre psychologie et de vos KPI de trading. Un miroir parfait de vos performances.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.4} className="rounded-[2rem] p-8 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-colors group">
            <ShieldCheck className="h-8 w-8 text-blue-500 mb-5 group-hover:scale-110 transition-transform duration-500" />
            <h4 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">Sécurité Maximale</h4>
            <p className="text-zinc-600 dark:text-zinc-400 font-light text-sm leading-relaxed">
              Hébergement de vos données ultra sécurisé. Vous connectez vos comptes sans partager aucune informations avec la plateforme.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.5} className="rounded-[2rem] p-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white relative overflow-hidden flex flex-col justify-center items-center text-center group cursor-pointer" onClick={goToFM}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
            
            <h4 className="text-3xl font-bold mb-4 z-10 transform group-hover:scale-105 transition-transform duration-300">Pret pour le changement ?</h4>
            <button disabled={isLoading} className="z-10 bg-white text-zinc-900 px-6 py-2.5 rounded-full font-semibold opacity-90 group-hover:opacity-100 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              {isLoading ? "Chargement..." : "Commencer maintenant"}
            </button>
          </FadeIn>

        </div>

      </div>
    </section>
  );
}
