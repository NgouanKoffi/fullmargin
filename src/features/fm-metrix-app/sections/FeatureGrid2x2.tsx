"use client";

// src/pages/fm-metrix/sections/FeatureGrid2x2.tsx
import React from "react";
import { ArrowRight, Zap } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import Image from "next/image";
import bgWhiteChart from "../../assets/fmmetrix/bg_white_chart.png";
import FadeIn from "../components/FadeIn";

type Props = { goToFM: () => void; isLoading: boolean };

import WindowFrame from "../components/WindowFrame";

export default function FeatureGrid2x2({ goToFM, isLoading }: Props) {
  return (
    <section
      id="fmmetrix-features"
      className="section-spacing relative overflow-hidden bg-zinc-50 dark:bg-transparent transition-colors duration-500"
    >
      {/* Background Chart for Dark Mode - FIXED with mix-blend-mode */}
      <div className="absolute inset-0 z-0 hidden dark:block">
        <Image
          src={bgWhiteChart}
          alt="Trading Chart Background Dark"
          fill
          className="object-cover opacity-40 invert hue-rotate-180 pointer-events-none mix-blend-screen contrast-150 saturate-0"
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-6">
        <FadeIn className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 text-zinc-900 dark:text-white transition-colors">
            Des <span className="text-brand">fonctionnalités uniques</span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto text-xl leading-relaxed transition-colors">
            Conçu pour les traders exigeants, Full Metrix combine rapidité d'exécution et profondeur d'analyse.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <FadeIn
            direction="left"
            className={`${contentCard} md:col-span-8 group hover-lift`}
          >
            <div className="flex flex-col lg:flex-row gap-12 items-center h-full">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 dark:bg-brand/20 px-3 py-1 text-xs font-semibold text-brand mb-6 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                  <Zap className="h-3 w-3" />
                  Performance
                </div>
                <h3 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white transition-colors">Mode BACKTEST Pro</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                  Testez vos stratégies en temps réel avec notre moteur de replay ultra-précis. <span className="text-brand font-medium whitespace-nowrap">Forex et Indice synthétique.</span>
                </p>
                <ul className="space-y-3 mb-10 inline-block text-left text-zinc-700 dark:text-zinc-300">
                  <Bullet>Mode replay</Bullet>
                  <Bullet>Indicateurs précis</Bullet>
                  <Bullet>Rapports de performance détaillés</Bullet>
                </ul>
                <div>
                  <button onClick={goToFM} disabled={isLoading} className={primaryBtn}>
                    Découvrir l'outil
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="w-full relative z-10 mt-8 lg:mt-0 lg:ml-8 transition-transform duration-500 hover:scale-[1.02] shadow-2xl">
                <WindowFrame className="w-full">
                  <LoopVideo
                    webm="/videos/backtest_1.webm"
                    mp4="/videos/backtest_1.mp4"
                    label="Mode Backtest"
                    className="w-full h-auto object-cover"
                  />
                </WindowFrame>
              </div>
            </div>
          </FadeIn>

          <FadeIn
            direction="right"
            delay={0.1}
            className={`${contentCard} md:col-span-4 flex flex-col justify-between group hover-lift`}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500 mb-6">
                <Zap className="h-3 w-3" />
                Avancé
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white transition-colors">Stratégies Assistées</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 transition-colors">
                L'IA analyse le Price Action en temps réel pour suggérer les zones de haute probabilité.
              </p>
            </div>
            <div className="space-y-3 mb-8 text-zinc-700 dark:text-zinc-300">
              <Bullet>Analyse technique auto</Bullet>
              <Bullet>Zones d'offre & demande</Bullet>
            </div>
            <div className="mt-8 mx-auto max-w-[90%] transform transition-transform duration-500 hover:scale-[1.02]">
              <WindowFrame>
                <LoopVideo
                  webm="/videos/backtest_2.webm"
                  mp4="/videos/backtest_2.mp4"
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
