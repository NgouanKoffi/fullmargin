// src/pages/fm-metrix/sections/StrategieHubSection.tsx
import { ArrowRight } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { mediaFrame, mediaWrap, primaryBtn } from "../ui/styles";

import StrategieHubWebm from "../../../assets/gif/converted/Strategie hub.webm";
import StrategieHubMp4 from "../../../assets/gif/converted/Strategie hub.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function StrategieHubSection({ goToFM, isLoading }: Props) {
  return (
    <section className="py-14 md:py-16 bg-white dark:bg-black border-b border-zinc-200/60 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className={mediaWrap}>
            <LoopVideo
              webm={StrategieHubWebm}
              mp4={StrategieHubMp4}
              label="Stratégie Hub"
              className={mediaFrame}
            />
          </div>

          <div className="text-center lg:text-left">
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400 uppercase">
              STRATEGIE HUB
            </h3>

            <ul className="mt-6 inline-block text-left space-y-3 text-base md:text-lg">
              <Bullet>Constructeur de stratégie</Bullet>
              <Bullet>Ajout et structuration</Bullet>
              <Bullet>Editez et améliorez votre stratégie</Bullet>
              <Bullet>Obtenez des suggestions d’amélioration par IA</Bullet>
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
    </section>
  );
}
