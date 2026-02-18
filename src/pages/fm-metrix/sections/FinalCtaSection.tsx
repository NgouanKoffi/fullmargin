// src/pages/fm-metrix/sections/FinalCtaSection.tsx
import { ArrowRight } from "lucide-react";

import Robot from "../../../assets/didyouknow.webp";
import { primaryBtn } from "../ui/styles";

type Props = { goToFM: () => void; isLoading: boolean };

export default function FinalCtaSection({ goToFM, isLoading }: Props) {
  return (
    <section className="bg-white dark:bg-black py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="overflow-hidden rounded-[42px] bg-[#1a0b2e] shadow-[0_30px_120px_rgba(123,97,255,0.25)]">
          <div className="grid items-center gap-10 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[420px_1fr]">
            <div className="flex justify-center lg:justify-start">
              <img
                src={Robot}
                alt="Robot Full Metrix"
                className="w-full max-w-[420px] drop-shadow-[0_24px_80px_rgba(123,97,255,0.45)]"
              />
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                <span className="text-violet-500">FULL METRIX,</span> votre
                espace professionnel alimenté par l’IA pour passer au niveau
                supérieur.
              </h2>

              <button
                type="button"
                onClick={goToFM}
                disabled={isLoading}
                className={"mt-8 " + primaryBtn}
              >
                {isLoading ? "Connexion…" : "Accédez à Full metrix"}
                {!isLoading ? (
                  <ArrowRight className="h-5 w-5" />
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
