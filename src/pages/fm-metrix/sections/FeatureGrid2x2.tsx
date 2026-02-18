// src/pages/fm-metrix/sections/FeatureGrid2x2.tsx
import { ArrowRight } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { mediaFrame, mediaWrap, primaryBtn } from "../ui/styles";

import Backtest1Webm from "../../../assets/gif/converted/Backtest 1.webm";
import Backtest1Mp4 from "../../../assets/gif/converted/Backtest 1.mp4";
import Backtest2Webm from "../../../assets/gif/converted/Backtest 2.webm";
import Backtest2Mp4 from "../../../assets/gif/converted/Backtest 2.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function FeatureGrid2x2({ goToFM, isLoading }: Props) {
  return (
    <section
      id="fmmetrix-features"
      className="pt-24 pb-20 bg-white dark:bg-black"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-1">
            <div className={mediaWrap}>
              <LoopVideo
                webm={Backtest1Webm}
                mp4={Backtest1Mp4}
                label="Mode Backtest"
                className={mediaFrame}
              />
            </div>
          </div>

          <div className="lg:order-2 text-center lg:text-left">
            <div className="mx-auto max-w-[680px] lg:mx-0 lg:max-w-none">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-violet-600 dark:text-violet-500">
                Mode BACKTEST
              </h2>

              <ul className="mt-6 inline-block text-left space-y-3 text-base md:text-lg">
                <Bullet>Outils d’analyses</Bullet>
                <Bullet>Mode replay des indices synthétiques</Bullet>
                <Bullet>Indicateurs performant</Bullet>
              </ul>

              <div className="mt-8 flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={goToFM}
                  disabled={isLoading}
                  className={primaryBtn}
                >
                  {isLoading ? "Connexion…" : "Découvrir"}
                  {!isLoading ? (
                    <ArrowRight className="h-5 w-5" />
                  ) : (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:order-4">
            <div className={mediaWrap}>
              <LoopVideo
                webm={Backtest2Webm}
                mp4={Backtest2Mp4}
                label="Analyses & stratégies"
                className={mediaFrame}
              />
            </div>
          </div>
          <div className="lg:order-3 text-center lg:text-left">
            <div className="mx-auto max-w-[680px] lg:mx-0 lg:max-w-none">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-violet-600 dark:text-violet-500 uppercase">
                STRATEGIES AVANCÉS
              </h2>

              <ul className="mt-6 inline-block text-left space-y-3 text-base md:text-lg">
                <Bullet>Analyse par IA avancé</Bullet>
                <Bullet>Stratégies d’analyse technique</Bullet>
                <Bullet>intégrées</Bullet>
              </ul>

              <div className="mt-8 flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={goToFM}
                  disabled={isLoading}
                  className={primaryBtn}
                >
                  {isLoading ? "Connexion…" : "Découvrir"}
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
      </div>
    </section>
  );
}
