// src/features/fm-metrix/sections/ChatAgentSection.tsx
import { ChevronRight } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import FadeIn from "../components/FadeIn";
import WindowFrame from "../components/WindowFrame";

import ChatIAWebm from "@assets/gif/converted/Chat IA.webm";
import ChatIAMp4 from "@assets/gif/converted/Chat IA.mp4";
import AgentIAWebm from "@assets/gif/converted/Agent IA.webm";
import AgentIAMp4 from "@assets/gif/converted/Agent IA.mp4";

export default function ChatAgentSection() {
  return (
    <section className="py-16 pb-32 relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold tracking-widest text-zinc-500 dark:text-zinc-500 uppercase mb-4">
            Intelligence Artificielle
          </h2>
          <h3 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-white">
            Votre équipe d'experts, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
              disponible 24/7
            </span>
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl leading-relaxed font-light">
            Une IA experte pour vous guider, et un agent 100% autonome pour auditer vos trades et gérer votre compte en toute sécurité.
          </p>
        </FadeIn>

        <div className="grid gap-16 lg:gap-12 lg:grid-cols-2">

          {/* Chat IA */}
          <FadeIn direction="up" delay={0.1} className="flex flex-col h-full rounded-[2rem] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 p-8 lg:p-10 backdrop-blur-xl shadow-xl hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.15)] transition-all duration-500 group overflow-hidden relative">
            
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Top: Video */}
            <div className="mb-10 w-full relative z-10">
              <div className="absolute inset-0 bg-violet-500/10 blur-[60px] rounded-full opacity-0 hover:opacity-100 transition-opacity duration-700 -z-10"></div>
              <div className="transform transition-transform duration-700 group-hover:-translate-y-2 relative shadow-xl rounded-2xl ring-1 ring-zinc-200/50 dark:ring-white/10">
                <WindowFrame className="shadow-none rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <LoopVideo
                    webm={ChatIAWebm}
                    mp4={ChatIAMp4}
                    label="Chat IA"
                    className="w-full h-[300px] object-cover"
                  />
                </WindowFrame>
              </div>
            </div>

            {/* Bottom: Text Content */}
            <div className="flex-1 flex flex-col items-center lg:items-start relative z-10">
              
              <h3 className="text-4xl md:text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400 bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite] uppercase tracking-tight text-center lg:text-left">
                CHAT IA
              </h3>

              <ul className="space-y-4 mb-10 w-full flex-1">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Une IA spécialisée pour les traders Connecté à votre agent
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Commandes directes vers votre compte metatrader
                  </span>
                </li>
              </ul>

              <a
                href="https://ia.fullmargin.net"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg md:text-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-1"
              >
                <span>Découvrir</span>
                <ChevronRight className="h-5 w-5 group/btn-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </FadeIn>


          {/* Agent IA */}
          <FadeIn delay={0.2} direction="up" className="flex flex-col h-full rounded-[2rem] bg-indigo-900/5 dark:bg-fuchsia-900/5 border border-fuchsia-500/20 p-8 lg:p-10 hover:border-fuchsia-500/40 hover:bg-white/60 dark:hover:bg-zinc-900/40 backdrop-blur-xl shadow-xl transition-all duration-500 group overflow-hidden relative">
            
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Top: Video */}
            <div className="mb-10 w-full relative z-10">
              <div className="absolute inset-0 bg-violet-500/10 blur-[60px] rounded-full opacity-0 hover:opacity-100 transition-opacity duration-700 -z-10"></div>
              <div className="transform transition-transform duration-700 group-hover:-translate-y-2 relative shadow-xl rounded-2xl ring-1 ring-zinc-200/50 dark:ring-white/10">
                <WindowFrame className="shadow-none rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <LoopVideo
                    webm={AgentIAWebm}
                    mp4={AgentIAMp4}
                    label="Agent IA"
                    className="w-full h-[300px] object-cover"
                  />
                </WindowFrame>
              </div>
            </div>

            {/* Bottom: Text Content */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
              
              <h3 className="text-4xl md:text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400 bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite] uppercase tracking-tight">
                AGENT IA
              </h3>

              <ul className="space-y-4 mb-10 w-full flex-1 text-left">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Un agent IA connecté à votre compte
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Exportation automatique de vos données metatrader
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Journal de trading automatique
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Outils de prise de positions et de gestion de multiples positions (SL/TP/BE sur plusieurs trades en même temps)
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                    Prise de position sur votre compte depuis la plateforme Fullmetrix
                  </span>
                </li>
              </ul>

              <a
                href="https://ia.fullmargin.net/agent"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg md:text-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-1 self-center lg:self-start"
              >
                <span>Découvrir</span>
                <ChevronRight className="h-5 w-5 group/btn-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
