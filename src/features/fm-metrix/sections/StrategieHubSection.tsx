// src/features/fm-metrix/sections/StrategieHubSection.tsx
import { ArrowRight, Layers, Repeat, Network } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import StrategieHubWebm from "@assets/gif/converted/Strategie hub.webm";
import StrategieHubMp4 from "@assets/gif/converted/Strategie hub.mp4";

export default function StrategieHubSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-transparent">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 relative z-10">
        
        <FadeIn className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-4">
            Écosystème Connecté
          </h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-white">
            Forgez votre système, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400 bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite]">
              partagez votre succès
            </span>
          </h3>
        </FadeIn>

        <div className="grid gap-8 lg:grid-cols-12 auto-rows-[auto]">

          {/* Hub Stratégique - Main Span */}
          <FadeIn direction="right" delay={0.1} className="lg:col-span-8 group relative rounded-[2rem] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 p-8 lg:p-12 backdrop-blur-xl overflow-hidden hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-500 flex flex-col md:flex-row gap-10 lg:gap-14 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-8 shadow-sm">
                <Layers className="h-6 w-6" />
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
                Hub Stratégique
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light mb-8 lg:mb-12">
                Le poste de commandement de votre trading. Construisez, testez et optimisez vos systèmes avec nos algorithmes natifs de précision. Un tableau blanc pour votre edge.
              </p>

              <div className="space-y-5 flex-1 mb-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Constructeur de stratégie visuel et intuitif</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Intégration et structuration modulaire de blocks</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Suggestions d'amélioration et optimisation par l'Intelligence Artificielle</p>
                </div>
              </div>

              <a
                href="https://ia.fullmargin.net/strategies"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] w-fit"
              >
                <span>Découvrir</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>

            </div>

            <div className="w-full md:w-[50%] lg:w-[45%] relative z-10 flex items-center justify-center -mb-8 -mr-8 md:mb-0 md:-mr-12 transform group-hover:scale-[1.03] transition-transform duration-700 ease-out">
              <WindowFrame className="w-full shadow-2xl rounded-l-2xl border-r-0 ring-1 ring-zinc-200/50 dark:ring-white/10 dark:bg-zinc-800">
                <LoopVideo
                  webm={StrategieHubWebm}
                  mp4={StrategieHubMp4}
                  label="Hub Stratégique"
                  className="w-full h-auto object-cover rounded-l-2xl"
                />
              </WindowFrame>
            </div>
          </FadeIn>

          {/* Copy Trading */}
          <FadeIn direction="left" delay={0.2} className="lg:col-span-4 group relative flex flex-col rounded-[2rem] bg-indigo-900/5 dark:bg-indigo-500/5 border border-indigo-500/20 p-8 lg:p-10 hover:border-blue-500/40 hover:bg-white/60 dark:hover:bg-zinc-900/40 backdrop-blur-xl transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-8 shadow-sm">
              <Network className="h-6 w-6" />
            </div>

            <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
              Copy Trading
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-light mb-8">
              L'effet de réseau à son paroxysme. Multipliez vos résultats et créez votre propre fonds virtuel.
            </p>

            <div className="space-y-5 flex-1 mb-10">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <Repeat className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Connectez plusieurs comptes MT5 synchronisés</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <Repeat className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Copiez l'élite ou monétisez vos signaux</p>
              </div>
            </div>

            <a
              href="https://ia.fullmargin.net/copy-trading"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium tracking-wide transition-all group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] mt-auto"
            >
              <span>Connecter le réseau</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
