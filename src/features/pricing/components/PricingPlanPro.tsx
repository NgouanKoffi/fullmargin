import { Sparkles, PlayCircle, LineChart, Bot, Brain, NotebookPen, Target, MessageCircle, Star, Copy } from "lucide-react";
import { ProFeature } from "./PricingFeatures";

type Props = {
  proLabel: string;
  proDisabled: boolean;
  checkingAccess: boolean;
  isProActive: boolean;
  openPaymentModal: () => void;
};

export function PricingPlanPro({
  proLabel,
  proDisabled,
  checkingAccess,
  isProActive,
  openPaymentModal,
}: Props) {
  return (
    <div
      data-cue="slide-up"
      data-delay="200"
      className="group relative rounded-[32px] p-[2px] overflow-hidden"
    >
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-fm-primary via-[#A855F7] to-fm-accent rounded-[32px] opacity-100 dark:opacity-80"></div>

      {/* Inner Card */}
      <div className="relative h-full bg-white dark:bg-[#0B0F14] rounded-[30px] p-8 sm:p-10 flex flex-col gap-6 backdrop-blur-3xl z-10 transition-transform duration-500 group-hover:-translate-y-1 shadow-2xl">

        <div>
          <h3 className="text-2xl font-bold mb-1 flex items-center gap-2 text-skin-base dark:text-white">
            Pro – L’expérience FullMargin complète
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </h3>
          <p className="text-sm text-slate-600 dark:text-gray-200">
            Tout ce que contient la formule Starter, avec en plus une puissance
            professionnelle portée par l’IA et des outils avancés dédiés aux
            traders sérieux.
          </p>
        </div>

        <div className="text-4xl font-extrabold text-skin-base dark:text-white flex items-baseline gap-2">
          29&nbsp;$
          <span className="text-sm font-normal text-slate-500 dark:text-gray-400">
            /mois
          </span>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-gray-400 mb-2">
            Fonctionnalités clés
          </p>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-100">
            <ProFeature icon={PlayCircle}>
              Mode replay (indices synthétiques et autres) — entraînez-vous en
              conditions réelles sans prendre de risque.
            </ProFeature>
            <ProFeature icon={LineChart}>
              Graphiques et backtests intégrés — analyse, indicateurs, zones
              clés et tests rapides sur vos idées.
            </ProFeature>
            <ProFeature icon={Bot}>
              Analyse IA du marché — stratégies intégrées et recommandations
              intelligentes pour vos décisions.
            </ProFeature>
            <ProFeature icon={Brain}>
              Strategy Hub — structurez votre stratégie et recevez des
              suggestions d’amélioration générées par l’IA.
            </ProFeature>
            <ProFeature icon={NotebookPen}>
              Journal de trading automatique — connecté à votre compte, avec
              métriques claires et analyse IA de vos performances.
            </ProFeature>
            <ProFeature icon={Target}>
              Outils de prise de position & gestion du risque — calcul
              automatique de taille, d’exposition et de scénarios.
            </ProFeature>
            <ProFeature icon={MessageCircle}>
              Chat IA connecté à votre compte — discutez directement avec votre
              IA pour analyser marchés et positions.
            </ProFeature>
            <ProFeature icon={Star}>
              Support prioritaire — assistance dédiée pour les membres Pro.
            </ProFeature>
            <ProFeature icon={Copy}>
              Copy trading (copy trading & interconnexion de plusieurs comptes MT5)
              <span className="ml-2 inline-flex items-center rounded-full bg-fm-primary/15 dark:bg-fm-primary/20 px-2 py-[2px] text-[10px] font-bold text-fm-primary dark:text-[#E879F9] ring-1 ring-inset ring-fm-primary/30 uppercase tracking-widest translate-y-[1px]">
                New
              </span>
            </ProFeature>
          </ul>
        </div>

        <button
          onClick={() => {
            if (!proDisabled) openPaymentModal();
          }}
          className={[
            "mt-2 w-full py-4 rounded-full text-base font-bold transition-all duration-300 relative z-10 disabled:opacity-70 disabled:cursor-not-allowed",
            isProActive
              ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-300 border border-slate-200 dark:border-white/10"
              : "bg-fm-primary text-white shadow-[0_8px_24px_rgba(111,60,255,0.4)] hover:shadow-[0_12px_32px_rgba(111,60,255,0.6)] hover:brightness-110",
          ].join(" ")}
          disabled={proDisabled}
          title={
            checkingAccess
              ? "Vérification de votre abonnement..."
              : isProActive
                ? "Vous êtes déjà sur Pro"
                : "Choisir Pro"
          }
        >
          {proLabel}
        </button>
      </div>
    </div>
  );
}
