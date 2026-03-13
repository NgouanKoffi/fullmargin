// src/features/fm-metrix/sections/FmMetrixFooter.tsx
import { Github, Twitter, Linkedin, Sparkles, ChevronRight } from "lucide-react";
import FadeIn from "../components/FadeIn";
import { Link } from "react-router-dom";

import BgFooter from "@assets/fmmetrix/bg_footer_starry.jpg";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FmMetrixFooter({ goToFM, isLoading }: Props) {
  return (
    <footer className="relative pt-32 pb-12 overflow-hidden bg-transparent">

      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 relative z-10">

        {/* --- MAIN CTA --- */}
        <FadeIn direction="up" className="mb-32">
          <div className="relative rounded-[2.5rem] bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 px-8 py-20 lg:py-24 text-center overflow-hidden flex flex-col items-center group shadow-2xl dark:shadow-none">
            
            {/* CTA Background animations */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_120deg,rgba(124,58,237,0.15)_180deg,transparent_240deg)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_120deg,rgba(124,58,237,0.3)_180deg,transparent_240deg)] animate-[spin_6s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute inset-1 rounded-[2.5rem] bg-white dark:bg-zinc-900 z-0 transition-colors duration-500"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-b from-violet-600/10 dark:from-violet-600/30 to-transparent blur-[80px] z-0"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 mb-8 backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                Dépassez vos limites
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight max-w-4xl transition-colors duration-500">
                Prenez l'avantage{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400 bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite]">
                  dès aujourd'hui.
                </span>
              </h2>
              
              <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg lg:text-xl font-light mb-12 transition-colors duration-500">
                Rejoignez l'élite. L'intelligence artificielle et l'automatisation au service de vos performances à long terme.
              </p>
              
              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className="relative group/btn inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold tracking-wide transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_40px_-5px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_-5px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 rounded-full border border-black/50 dark:border-white/50 group-hover/btn:scale-105 transition-transform duration-500 opacity-0 group-hover/btn:opacity-100"></div>
                <span className="text-lg">{isLoading ? "Ouverture..." : "Accéder à la plateforme"}</span>
                {isLoading ? (
                  <span className="h-5 w-5 rounded-full border-[2.5px] border-white/20 dark:border-zinc-950/20 border-t-white dark:border-t-zinc-950 animate-spin" />
                ) : (
                  <ChevronRight className="h-5 w-5 opacity-70 group-hover/btn:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </div>
        </FadeIn>

        {/* --- FOOTER CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 pb-16 border-b border-zinc-200 dark:border-white/10">
          
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-6">
              FULL METRIX <span className="text-violet-600 dark:text-violet-500">2.0</span>
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed font-light mb-8">
              La plateforme complète pour les traders exigeants. IA, Agent autonome et Dashboard professionnel.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/fullmargin" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors cursor-pointer">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/fullmargin" target="_blank" rel="noreferrer"  className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors cursor-pointer">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com/fullmargin" target="_blank" rel="noreferrer"  className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors cursor-pointer">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-widest text-xs mb-6">L'Écosystème</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={goToFM} className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors text-left flex items-center">
                  Broker (Plateforme)
                </button>
              </li>
              <li>
                <Link to="/full-propfirm" className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors">Full PropFirm (Financement)</Link>
              </li>
              <li>
                <Link to="/communaute" className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors">Communauté Sociale</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-widest text-xs mb-6">Support & Légal</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/cgv" className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors">Conditions Générales (CGV)</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors">Politique de Confidentialité</Link>
              </li>
              <li>
                <a href="mailto:support@fullmargin.net" className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors">Nous contacter</a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          <p>© {new Date().getFullYear()} FULL MARGIN HOLDING. TOUS DROITS RÉSERVÉS.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">Status Système</span>
            <span className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 group">
              <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-pulse"></span> Operationnel
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
