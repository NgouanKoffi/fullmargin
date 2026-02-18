// src/pages/Pricing.tsx
import type React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  ShieldCheck,
  X,
  PlayCircle,
  LineChart,
  Bot,
  Brain,
  NotebookPen,
  Target,
  MessageCircle,
  Star,
} from "lucide-react";
import PaymentMethodModal, {
  type PaymentMethod as ModalPaymentMethod,
} from "../components/payment/PaymentMethodModal";
import { usePricingPayment } from "./pricing/usePricingPayment";

export default function Pricing() {
  const {
    isSubmitting,
    toast,
    clearToast,

    showPaymentModal,
    openPaymentModal,
    closePaymentModal,

    handleProStripe,
    submitCryptoPayment, // ✅ On récupère la fonction

    alreadySubscribed,
    checkingAccess,
    loadingMethod,
  } = usePricingPayment();

  const isProActive = alreadySubscribed;

  const safeLoadingMethod: ModalPaymentMethod =
    loadingMethod === "card" ? "card" : null;

  // Starter button
  const starterLabel = checkingAccess
    ? "Chargement..."
    : isProActive
      ? "Inclus avec Pro"
      : "Votre plan actuel";

  // Pro button
  const proDisabled = isSubmitting || checkingAccess || isProActive;
  const proLabel = checkingAccess
    ? "Vérification..."
    : isProActive
      ? "Votre plan actuel"
      : isSubmitting
        ? "Vérification..."
        : "Choisir Pro";

  return (
    <div className="min-h-screen bg-skin-surface text-skin-base dark:bg-[#0f1115] dark:text-gray-100 relative">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[999] max-w-sm w-full sm:w-auto rounded-2xl shadow-lg border flex items-start gap-3 p-3 pr-2
            ${
              toast.tone === "error"
                ? "bg-red-500 text-white border-red-500/70"
                : toast.tone === "success"
                  ? "bg-emerald-500 text-white border-emerald-500/70"
                  : "bg-indigo-500 text-white border-indigo-500/70"
            }
          `}
        >
          <div className="mt-0.5">
            <ShieldCheck className="w-5 h-5 opacity-90" />
          </div>
          <div className="flex-1 text-sm leading-snug">
            {toast.message.split("\n").map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <button
            onClick={clearToast}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HERO */}
      <section className="text-center px-6 py-16 sm:py-20">
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
        >
          Des tarifs{" "}
          <span className="text-indigo-500 dark:text-indigo-400">clairs</span>{" "}
          et{" "}
          <span className="text-indigo-500 dark:text-indigo-400">
            flexibles
          </span>
        </motion.h1>
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-gray-400"
        >
          Choisissez le plan qui correspond à vos ambitions. <br />
          Passez au niveau supérieur sans surprise.
        </motion.p>
      </section>

      {/* PLANS */}
      <section className="px-6 pb-20 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto md:items-start">
        {/* STARTER */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white/80 dark:bg-[#1a1d24] border border-slate-200/60 dark:border-white/5 rounded-3xl p-8 flex flex-col gap-6 shadow-[0_24px_50px_rgba(15,23,42,0.07)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
        >
          <div>
            <h3 className="text-2xl font-bold mb-1 text-skin-base dark:text-white">
              Starter
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">
              Accédez à l’essentiel pour structurer votre progression et
              développer votre discipline.
            </p>
          </div>

          <div className="text-4xl font-extrabold text-skin-base dark:text-white flex items-baseline gap-2">
            Gratuit
            <span className="text-sm font-normal text-slate-500 dark:text-gray-400">
              /mois
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-700 dark:text-gray-200 mb-3">
              Cet abonnement inclut :
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-200">
              <Feature>
                Outils de prise de notes, de gestion des tâches et de projets
              </Feature>
              <Feature>Journal de trading complet</Feature>
              <Feature>
                Gestion de vos finances avec suivi de performance
              </Feature>
              <Feature>
                Podcasts et playlists exclusifs pour nourrir votre mindset
              </Feature>
              <Feature>Création et gestion de votre propre communauté</Feature>
              <Feature>
                Accès à la marketplace et possibilité de créer votre boutique
              </Feature>
              <Feature>
                Support partiellement dédié pour vous accompagner au quotidien
              </Feature>
            </ul>
          </div>

          <button
            className="mt-2 w-full bg-slate-900/5 text-slate-500 dark:bg-gray-200/5 dark:text-gray-400 py-3 rounded-full text-sm font-semibold transition cursor-not-allowed"
            disabled
            aria-disabled="true"
            title={
              checkingAccess
                ? "Chargement..."
                : isProActive
                  ? "Le plan Starter est inclus dans Pro"
                  : "Ce plan est actif"
            }
          >
            {starterLabel}
          </button>
        </motion.div>

        {/* PRO */}
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
              Tout ce que contient la formule Starter, avec en plus une
              puissance professionnelle portée par l’IA et des outils avancés
              dédiés aux traders sérieux.
            </p>
          </div>

          {/* prix fixe */}
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
                Chat IA connecté à votre compte — discutez directement avec
                votre IA pour analyser marchés et positions.
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
            aria-disabled={proDisabled}
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
      </section>

      {/* MODAL DE CHOIX DU MOYEN DE PAIEMENT */}
      <PaymentMethodModal
        open={showPaymentModal}
        onClose={closePaymentModal}
        loadingMethod={safeLoadingMethod}
        disabled={checkingAccess || alreadySubscribed}
        onCard={() => void handleProStripe()}
        // ✅ ICI : On connecte la fonction qui résout ton erreur
        onSubmitCrypto={(network) => void submitCryptoPayment(network)}
      />
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 items-start">
      <Check className="w-4 h-4 mt-0.5 text-indigo-400 dark:text-indigo-300 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function ProFeature({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2 items-start">
      <Icon className="w-4 h-4 mt-0.5 text-indigo-300 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
