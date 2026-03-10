/**
 * Full Metrix - Footer Section
 */
"use client";

import React from "react";
import { ArrowRight, Github, Twitter, Linkedin, Sparkles } from "lucide-react";
import { contentCard, primaryBtn } from "../ui/styles";
import Image from "next/image";
import FadeIn from "../components/FadeIn";

// Real assets from user
import bgFooterStarry from "../../assets/fmmetrix/bg_footer_starry.jpg";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FmMetrixFooter({ goToFM, isLoading }: Props) {
  return (
    <footer className="relative pt-20 pb-10 overflow-hidden border-t border-white/10 text-white">
      {/* Theme 2: Galaxy Footer Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgFooterStarry}
          alt="Galaxy Footer Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Merged Final CTA Content */}
        <FadeIn className={`${contentCard} bg-transparent p-0 mb-20 relative overflow-hidden group border-none shadow-none`}>
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

        {/* Footer Links */}
        <FadeIn delay={0.2} className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div className="md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter mb-6 text-white">FULL METRIX <span className="text-brand">AI</span></div>
            <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
              L'écosystème de trading le plus avancé, propulsé par l'intelligence artificielle pour des décisions data-driven.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <div key={i} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-brand hover:text-white hover:border-brand hover:scale-110 transition-all cursor-pointer">
                  <Icon className="h-5 w-5" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white uppercase text-[10px] tracking-[0.2em] opacity-40">Plateforme</h4>
            <ul className="space-y-4 text-zinc-400">
              {['Dashboard', 'Agent IA', 'Backtest', 'Tarifs'].map((item) => (
                <li key={item} className="hover:text-white transition-colors cursor-pointer text-xs font-medium uppercase tracking-wider">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white uppercase text-[10px] tracking-[0.2em] opacity-40">Légal</h4>
            <ul className="space-y-4 text-zinc-400">
              {['Conditions', 'Confidentialité', 'Sécurité'].map((item) => (
                <li key={item} className="hover:text-white transition-colors cursor-pointer text-xs font-medium uppercase tracking-wider">{item}</li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest text-zinc-500/60">
          <div>© 2026 FULL METRIX. TOUS DROITS RÉSERVÉS.</div>
          <div className="flex gap-8">
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            <span className="hover:text-white transition-colors cursor-pointer">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
