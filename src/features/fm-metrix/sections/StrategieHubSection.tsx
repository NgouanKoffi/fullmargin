// src/features/fm-metrix/sections/StrategieHubSection.tsx
import { ArrowRight, Layers, Repeat } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import StrategieHubWebm from "@assets/gif/converted/Strategie hub.webm";
import StrategieHubMp4 from "@assets/gif/converted/Strategie hub.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function StrategieHubSection({ goToFM, isLoading }: Props) {
  return (
    <section className="py-24 relative overflow-hidden bg-zinc-50 dark:bg-[#050505] transition-colors duration-500 border-b border-zinc-200/50 dark:border-white/5">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[800px] h-[800px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-[1440px] px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2">

          {/* Card 1: Hub Stratégique */}
          <FadeIn delay={0} className={`${contentCard} group flex flex-col`}>
            <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame>
                <LoopVideo
                  webm={StrategieHubWebm}
                  mp4={StrategieHubMp4}
                  label="Hub Stratégique"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-4">
                <Layers className="h-3 w-3" />
                Hub Stratégique
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">
                Centralisez vos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
                  Performances
                </span>
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                Le cerveau de votre trading. Construisez et testez vos systèmes
                avec nos algorithmes d'optimisation.
              </p>
              <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                <Bullet>Constructeur de stratégie intuitif</Bullet>
                <Bullet>Ajout et structuration modulaire</Bullet>
                <Bullet>Editez et améliorez votre stratégie nativement</Bullet>
                <Bullet>Obtenez des suggestions d'amélioration par IA</Bullet>
              </ul>
            </div>

            <button
              type="button"
              onClick={goToFM}
              disabled={isLoading}
              className={`${primaryBtn} w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500`}
            >
              {isLoading ? "Connexion…" : "Gérer mes stratégies"}
              {!isLoading ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              )}
            </button>
          </FadeIn>

          {/* Card 2: Copy Trading */}
          <FadeIn
            delay={0.1}
            className={`${contentCard} group flex flex-col bg-blue-50/50 dark:bg-blue-500/5 hover:border-blue-500/30`}
          >
            {/* Placeholder visuel pour Copy Trading */}
            <div className="mb-8 w-full">
              <WindowFrame>
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40 flex items-center justify-center">
                  <div className="text-center">
                    <Repeat className="h-12 w-12 text-blue-500/60 mx-auto mb-2" />
                    <p className="text-xs text-blue-400/60 font-medium">Copy Trading</p>
                  </div>
                </div>
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
                <Repeat className="h-3 w-3" />
                Social
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">
                COPY{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                  TRADING
                </span>
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                Connectez votre écosystème et profitez de la puissance du
                trading social.
              </p>
              <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                <Bullet>Connecter plusieurs comptes MT5</Bullet>
                <Bullet>Copier les meilleurs traders</Bullet>
                <Bullet>Monétiser vos propres signaux</Bullet>
              </ul>
            </div>

            <button
              type="button"
              onClick={goToFM}
              disabled={isLoading}
              className={`${primaryBtn} w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_20px_50px_rgba(37,99,235,0.3)]`}
            >
              {isLoading ? "Connexion…" : "Lancer le Copy Trading"}
              {!isLoading ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              )}
            </button>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
