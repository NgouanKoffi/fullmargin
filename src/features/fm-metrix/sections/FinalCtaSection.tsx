// src/features/fm-metrix/sections/FinalCtaSection.tsx
import { ArrowRight, Sparkles } from "lucide-react";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

type Props = { goToFM: () => void; isLoading: boolean };

export default function FinalCtaSection({ goToFM, isLoading }: Props) {
  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <FadeIn
          className={`${contentCard} bg-zinc-900 dark:bg-zinc-900/60 relative overflow-hidden group`}
        >
          {/* Glow central */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600 rounded-full blur-[160px]" />
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300 ring-1 ring-violet-500/20 backdrop-blur-md mb-8">
              <Sparkles className="h-4 w-4" />
              Prêt pour le futur
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
              Propulsez votre{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Trading
              </span>
              <br />
              dans une nouvelle dimension.
            </h2>

            <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              L'intelligence artificielle n'est plus une option. C'est votre
              nouvel avantage compétitif sur les marchés mondiaux.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className={`${primaryBtn} text-lg px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.8)] hover:-translate-y-1 transition-all duration-300 border border-white/20`}
              >
                <span className="relative z-10 flex items-center gap-3 font-semibold">
                  {isLoading ? "Préparation…" : "Commencer Gratuitement"}
                  {!isLoading ? (
                    <ArrowRight className="h-6 w-6" />
                  ) : (
                    <span className="inline-block h-5 w-5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                </span>
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
