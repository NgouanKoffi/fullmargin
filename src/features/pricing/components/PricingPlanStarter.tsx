import { motion } from "framer-motion";
import { Feature } from "./PricingFeatures";

type Props = {
  starterLabel: string;
  checkingAccess: boolean;
  isProActive: boolean;
};

export function PricingPlanStarter({
  starterLabel,
  checkingAccess,
  isProActive,
}: Props) {
  return (
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
          Accédez à l’essentiel pour structurer votre progression et développer
          votre discipline.
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
          <Feature>Gestion de vos finances avec suivi de performance</Feature>
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
  );
}
