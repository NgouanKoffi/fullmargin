/**
 * Full Metrix - Strategic Hub & Copy Trading Section
 */
"use client";
import React from "react";
import { ArrowRight, Layers, Users, Repeat } from "lucide-react";
import LoopVideo from "../components/LoopVideo";
import Bullet from "../components/Bullet";
import { contentCard, primaryBtn } from "../ui/styles";
import FadeIn from "../components/FadeIn";

import Image from "next/image";
import bgWhiteChart from "../../assets/fmmetrix/bg_white_chart.png";

type Props = { goToFM: () => void; isLoading: boolean };

import WindowFrame from "../components/WindowFrame";

export default function StrategieHubSection({ goToFM, isLoading }: Props) {
    return (
        <section className="section-spacing relative overflow-hidden bg-zinc-50 dark:bg-transparent transition-colors duration-500">
            {/* Background Chart for Dark Mode */}
            <div className="absolute inset-0 z-0 hidden dark:block">
                <Image
                    src={bgWhiteChart}
                    alt="Trading Chart Background Dark"
                    fill
                    className="object-cover opacity-40 invert hue-rotate-180 pointer-events-none mix-blend-screen contrast-150 saturate-0"
                />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="mx-auto max-w-[1440px] px-6 relative z-10">
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Card 1: Hub Stratégique */}
                    <FadeIn delay={0} className={`${contentCard} group hover-lift flex flex-col`}>
                        <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
                            <WindowFrame>
                                <LoopVideo
                                    webm="/videos/strategie_hub.webm"
                                    mp4="/videos/strategie_hub.mp4"
                                    label="Hub Stratégique"
                                    className="w-full h-auto object-cover"
                                />
                            </WindowFrame>
                        </div>

                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 dark:bg-brand/20 px-3 py-1 text-xs font-semibold text-brand mb-4">
                                <Layers className="h-3 w-3" />
                                Hub Stratégique
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">Centralisez vos <span className="text-brand">Performances</span></h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                                Le cerveau de votre trading. Construisez et testez vos systèmes avec nos algorithmes d'optimisation.
                            </p>
                            <ul className="space-y-4 mb-10 text-zinc-700 dark:text-zinc-300">
                                <Bullet>Constructeur visuel</Bullet>
                                <Bullet>Suggestions d'IA</Bullet>
                                <Bullet>Analyse de risque</Bullet>
                                <Bullet>Export de data</Bullet>
                            </ul>
                        </div>

                        <button onClick={goToFM} disabled={isLoading} className={primaryBtn + " w-full"}>
                            Gérer mes stratégies
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </FadeIn>

                    {/* Card 2: Copy Trading */}
                    <FadeIn delay={0.1} className={`${contentCard} group hover-lift flex flex-col bg-blue-50 dark:bg-blue-500/5 hover:border-blue-500/30`}>
                        <div className="mb-8 w-full transform transition-transform duration-500 hover:scale-[1.02]">
                            <WindowFrame>
                                <Image
                                    src="/videos/copy_trading.gif"
                                    alt="Copy Trading"
                                    width={600}
                                    height={400}
                                    className="w-full h-auto object-cover"
                                    unoptimized
                                />
                            </WindowFrame>
                        </div>

                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
                                <Repeat className="h-3 w-3" />
                                Social
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors">COPY TRADING</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed transition-colors">
                                Connectez votre écosystème et profitez de la puissance du trading social.
                            </p>
                            <ul className="space-y-4 mb-10 text-sm text-zinc-700 dark:text-zinc-300">
                                <Bullet>Connecter plusieurs comptes MT5</Bullet>
                                <Bullet>Copier les meilleurs traders</Bullet>
                                <Bullet>Monétiser vos propres signaux</Bullet>
                            </ul>
                        </div>

                        <button onClick={goToFM} disabled={isLoading} className={primaryBtn + " w-full bg-blue-600 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"}>
                            Lancer le Copy Trading
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
