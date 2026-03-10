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
    <div
      data-cue="slide-up"
      className="bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 sm:p-10 flex flex-col gap-6 shadow-xl transition-transform duration-500 hover:-translate-y-1 relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800/50 rounded-bl-[100px] -z-10" />
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
        className="mt-2 w-full py-4 rounded-full text-base font-bold transition-all duration-300 bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400 border border-transparent dark:border-white/5 cursor-not-allowed"
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
    </div>
  );
}
