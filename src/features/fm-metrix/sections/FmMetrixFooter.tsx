// src/features/fm-metrix/sections/FmMetrixFooter.tsx
import { ArrowRight, Github, Twitter, Linkedin, Sparkles } from "lucide-react";
import { primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

import BgFooter from "@assets/fmmetrix/bg_footer_starry.jpg";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FmMetrixFooter({ goToFM, isLoading }: Props) {
  return (
    <footer className="relative pt-20 pb-10 overflow-hidden border-t border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white transition-colors duration-500">
      {/* Light mode: soft gradient. Dark mode: galaxy image */}
      <div className="absolute inset-0 z-0">
        {/* Fond clair (light mode) */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-zinc-50 dark:hidden" />
        {/* Fond galaxie (dark mode) */}
        <img
          src={BgFooter}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover hidden dark:block"
        />
        <div className="absolute inset-0 bg-black/50 hidden dark:block" />
        {/* Subtil accent violet en light mode */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-200/40 rounded-full blur-[120px] pointer-events-none dark:hidden" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">

        {/* === CTA === */}
        <FadeIn className="mb-20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600 rounded-full blur-[160px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-500/20 backdrop-blur-md mb-8">
              <Sparkles className="h-4 w-4" />
              Prêt pour le futur
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-8 leading-tight tracking-tight">
              Propulsez votre{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                Trading
              </span>
              <br />
              dans une nouvelle dimension.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              L'intelligence artificielle n'est plus une option. C'est votre
              nouvel avantage compétitif sur les marchés mondiaux.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className={`${primaryBtn} scale-110 !px-10 !py-4`}
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

        {/* === Footer Links === */}
        <FadeIn
          delay={0.2}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-zinc-200 dark:border-white/10"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter mb-6 text-zinc-900 dark:text-white">
              FULL METRIX{" "}
              <span className="text-violet-600 dark:text-violet-400">AI</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8 leading-relaxed">
              L'écosystème de trading le plus avancé, propulsé par
              l'intelligence artificielle pour des décisions data-driven.
            </p>
            <div className="flex gap-4">
              {([Twitter, Github, Linkedin] as const).map((Icon, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-violet-600 hover:text-white hover:border-violet-600 hover:scale-110 transition-all cursor-pointer"
                >
                  <Icon className="h-5 w-5" />
                </div>
              ))}
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <h4 className="font-bold mb-6 text-zinc-900 dark:text-white uppercase text-[10px] tracking-[0.2em] opacity-40">
              Plateforme
            </h4>
            <ul className="space-y-4 text-zinc-500 dark:text-zinc-400">
              {["Dashboard", "Agent IA", "Backtest", "Tarifs"].map((item) => (
                <li
                  key={item}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-xs font-medium uppercase tracking-wider"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-bold mb-6 text-zinc-900 dark:text-white uppercase text-[10px] tracking-[0.2em] opacity-40">
              Légal
            </h4>
            <ul className="space-y-4 text-zinc-500 dark:text-zinc-400">
              {["Conditions", "Confidentialité", "Sécurité"].map((item) => (
                <li
                  key={item}
                  className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer text-xs font-medium uppercase tracking-wider"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        {/* === Bottom Bar === */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest text-zinc-400/60 dark:text-zinc-500/60">
          <div>© {new Date().getFullYear()} FULL METRIX. TOUS DROITS RÉSERVÉS.</div>
          <div className="flex gap-8">
            <span className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer">Support</span>
            <span className="hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer">Status</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
