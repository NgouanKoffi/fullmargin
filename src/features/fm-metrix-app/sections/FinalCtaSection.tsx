/**
 * Full Metrix - Final CTA Section
 */
"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

import Image from "next/image";
import bgWhiteChart from "../../assets/fmmetrix/bg_white_chart.png";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FinalCtaSection({ goToFM, isLoading }: Props) {
  return (
    <section className="section-spacing relative overflow-hidden bg-transparent">
      {/* Background Chart for Dark Mode */}
      <div className="absolute inset-0 z-0 hidden dark:block">
        <Image
          src={bgWhiteChart}
          alt="Trading Chart Background Dark"
          fill
          className="object-cover opacity-50 invert hue-rotate-180 pointer-events-none mix-blend-screen"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <FadeIn className={`${contentCard} bg-zinc-900 dark:bg-zinc-900/60 p-12 md:p-20 relative overflow-hidden group`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand rounded-full blur-[160px]" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand ring-1 ring-brand/20 backdrop-blur-md mb-8">
              <Sparkles className="h-4 w-4" />
              Prêt pour le futur
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
              Propulsez votre <span className="bg-gradient-to-r from-brand to-violet-400 bg-clip-text text-transparent">Trading</span> <br />
              dans une nouvelle dimension.
            </h2>
            <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              L'intelligence artificielle n'est plus une option. C'est votre nouvel avantage compétitif sur les marchés mondiaux.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className={primaryBtn + " scale-110 !px-10 !py-4"}
              >
                {isLoading ? "Préparation…" : "Commencer Gratuitement"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-8 text-sm text-zinc-500">
              Aucune carte bancaire requise. Accès instantané.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
