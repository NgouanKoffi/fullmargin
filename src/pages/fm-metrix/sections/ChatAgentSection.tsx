// src/pages/fm-metrix/sections/ChatAgentSection.tsx
import { ArrowRight } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { mediaFrame, mediaWrap, primaryBtn } from "../ui/styles";

import ChatIAWebm from "../../../assets/gif/converted/Chat IA.webm";
import ChatIAMp4 from "../../../assets/gif/converted/Chat IA.mp4";
import AgentIAWebm from "../../../assets/gif/converted/Agent IA.webm";
import AgentIAMp4 from "../../../assets/gif/converted/Agent IA.mp4";

type Props = { goToFM: () => void; isLoading: boolean };

export default function ChatAgentSection({ goToFM, isLoading }: Props) {
  return (
    <section className="py-16 md:py-20 bg-white dark:bg-black border-y border-zinc-200/60 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className={mediaWrap}>
              <LoopVideo
                webm={ChatIAWebm}
                mp4={ChatIAMp4}
                label="Chat IA Full Metrix"
                className={mediaFrame}
              />
            </div>

            <h3 className="mt-10 text-4xl md:text-5xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400 uppercase">
              CHAT IA
            </h3>

            <ul className="mt-6 inline-block text-left space-y-3 text-base md:text-lg">
              <Bullet>Une IA spécialisée pour les traders</Bullet>
              <Bullet>Connecté à votre agent</Bullet>
              <Bullet>Commandes directes vers votre compte metatrader</Bullet>
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

          <div className="text-center lg:text-left">
            <div className={mediaWrap}>
              <LoopVideo
                webm={AgentIAWebm}
                mp4={AgentIAMp4}
                label="Agent IA"
                className={mediaFrame}
              />
            </div>

            <h3 className="mt-10 text-4xl md:text-5xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400 uppercase">
              AGENT IA
            </h3>

            <ul className="mt-6 inline-block text-left space-y-3 text-base md:text-lg">
              <Bullet>Un agent IA connecté à votre compte</Bullet>
              <Bullet>Exportation automatique de os donnée metatrader</Bullet>
              <Bullet>Journal de trading automatique</Bullet>
              <Bullet>
                Outils de prise de postions et de gestion de multiples position
                (SL/TP/BE sur plusieurs trades en meme temps)
              </Bullet>
              <Bullet>
                Prise de position sur votre compte depuis la plateforme
                Fullmetrix
              </Bullet>
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
