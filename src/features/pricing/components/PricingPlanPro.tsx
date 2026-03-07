import { motion } from "framer-motion";
import { Sparkles, PlayCircle, LineChart, Bot, Brain, NotebookPen, Target, MessageCircle, Star } from "lucide-react";
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
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      viewport={{ once: true }}
      className="relative bg-white/95 dark:bg-[#171a33] border border-indigo-500/30 dark:border-indigo-500/50 rounded-3xl p-8 flex flex-col gap-6 shadow-[0_24px_50px_rgba(79,70,229,0.08)] dark:shadow-[0_24px_50px_rgba(79,70,229,0.25)]"
    >
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
        Le meilleur
      </span>

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
        </ul>
      </div>

      <button
        onClick={() => {
          if (!proDisabled) openPaymentModal();
        }}
        className={[
          "mt-2 w-full py-3 rounded-full text-sm font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed",
          isProActive
            ? "bg-slate-900/5 text-slate-500 dark:bg-gray-200/5 dark:text-gray-300"
            : "bg-indigo-500 hover:bg-indigo-600 text-white",
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
    </motion.div>
  );
}
