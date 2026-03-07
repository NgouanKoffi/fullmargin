"use client";

import React from "react";
import { ArrowRight, MessageSquare, Bot } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

import Image from "next/image";
import bgWhiteChart from "../../assets/fmmetrix/bg_white_chart.png";

type Props = { goToFM: () => void; isLoading: boolean };

import WindowFrame from "../components/WindowFrame";

export default function ChatAgentSection({ goToFM, isLoading }: Props) {
  return (
    <section className="section-spacing bg-white dark:bg-zinc-950/20 relative overflow-hidden transition-colors duration-500">
      {/* Background Chart for Dark Mode */}
      <div className="absolute inset-0 z-0 hidden dark:block">
        <Image
          src={bgWhiteChart}
          alt="Trading Chart Background Dark"
          fill
          className="object-cover opacity-40 invert hue-rotate-180 pointer-events-none mix-blend-screen contrast-150 saturate-0"
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Chat IA */}
          <FadeIn delay={0} className={`${contentCard} group hover-lift flex flex-col`}>
            <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame className="shadow-brand/20">
                <LoopVideo
                  webm="/videos/chat_ia.webm"
                  mp4="/videos/chat_ia.mp4"
                  label="Chat IA"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 dark:bg-brand/20 px-3 py-1 text-xs font-semibold text-brand mb-4">
                Assistant
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">CHAT IA Intelligent</h3>
              <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                <Bullet>IA spécialisée en analyse de marchés</Bullet>
                <Bullet>communiquer directement avec votre compte MT5</Bullet>
                <Bullet>Le Chat GPT spécialisé pour les traders</Bullet>
              </ul>
            </div>

            <button onClick={goToFM} disabled={isLoading} className={primaryBtn + " w-full"}>
              Parler à l'IA
              <ArrowRight className="h-4 w-4" />
            </button>
          </FadeIn>

          {/* Agent IA */}
          <FadeIn delay={0.1} className={`${contentCard} group hover-lift flex flex-col bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-500/30`}>
            <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame className="shadow-emerald-500/20">
                <LoopVideo
                  webm="/videos/agent_ia.webm"
                  mp4="/videos/agent_ia.mp4"
                  label="Agent IA"
                  className="w-full h-auto object-cover"
                />
              </WindowFrame>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
                Autonome
              </div>
              <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">AGENT IA Autonome</h3>
              <ul className="space-y-4 mb-10 text-sm text-zinc-700 dark:text-zinc-300">
                <Bullet>Journal de trading 100% automatique</Bullet>
                <Bullet>Gestion multi-positions (SL/TP/BE)</Bullet>
                <Bullet>Exécution haute fréquence depuis le dashboard</Bullet>
              </ul>
            </div>

            <button onClick={goToFM} disabled={isLoading} className={primaryBtn + " w-full bg-emerald-600 shadow-[0_20px_50px_rgba(16,185,129,0.3)]"}>
              Activer l'Agent
              <ArrowRight className="h-4 w-4" />
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}