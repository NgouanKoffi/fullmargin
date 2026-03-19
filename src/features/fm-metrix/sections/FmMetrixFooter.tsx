// src/features/fm-metrix/sections/FmMetrixFooter.tsx
import { Sparkles, ChevronRight } from "lucide-react";
import FadeIn from "../components/FadeIn";


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

      </div>
    </footer>
  );
}
