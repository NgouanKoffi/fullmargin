// src/features/fm-metrix/sections/ChatAgentSection.tsx
import { ArrowRight } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import ChatIAWebm from "@assets/gif/converted/Chat IA.webm";
import ChatIAMp4 from "@assets/gif/converted/Chat IA.mp4";
import AgentIAWebm from "@assets/gif/converted/Agent IA.webm";
import AgentIAMp4 from "@assets/gif/converted/Agent IA.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function ChatAgentSection({ goToFM, isLoading }: Props) {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2">

          {/* Chat IA */}
          <FadeIn delay={0} className={`${contentCard} group flex flex-col`}>
            <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame className="shadow-violet-500/20">
                <LoopVideo
                  webm={ChatIAWebm}
                  mp4={ChatIAMp4}
                  label="Chat IA Full Metrix"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-4">
                L'Assistant
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">
                CHAT{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
                  IA
                </span>{" "}
                Intelligent
              </h3>
              <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                <Bullet>Une IA spécialisée pour les traders</Bullet>
                <Bullet>Connecté à votre agent</Bullet>
                <Bullet>Commandes directes vers votre compte MT5</Bullet>
              </ul>
            </div>

            <button
              type="button"
              onClick={goToFM}
              disabled={isLoading}
              className={`${primaryBtn} w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500`}
            >
              {isLoading ? "Connexion…" : "Parler à l'IA"}
              {!isLoading ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              )}
            </button>
          </FadeIn>

          {/* Agent IA */}
          <FadeIn
            delay={0.1}
            className={`${contentCard} group flex flex-col bg-emerald-50/50 dark:bg-emerald-500/5 hover:border-emerald-500/30`}
          >
            <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame className="shadow-emerald-500/20">
                <LoopVideo
                  webm={AgentIAWebm}
                  mp4={AgentIAMp4}
                  label="Agent IA"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
                Autonome
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">
                AGENT{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                  IA
                </span>{" "}
                Autonome
              </h3>
              <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                <Bullet>Un agent IA connecté à votre compte</Bullet>
                <Bullet>Journal de trading automatique</Bullet>
                <Bullet>Gestion multi-positions (SL/TP/BE simultanés)</Bullet>
                <Bullet>Exportation automatique de vos données</Bullet>
                <Bullet>Prise de position centralisée depuis FullMetrix</Bullet>
              </ul>
            </div>

            <button
              type="button"
              onClick={goToFM}
              disabled={isLoading}
              className={`${primaryBtn} w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_20px_50px_rgba(16,185,129,0.3)]`}
            >
              {isLoading ? "Connexion…" : "Activer l'Agent"}
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
