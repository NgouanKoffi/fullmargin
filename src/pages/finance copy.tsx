// src/pages/finance.tsx
import { Wallet2, Wrench, Clock } from "lucide-react";

export default function FinancePage() {
  return (
    <main className="w-full">
      {/* HEADER */}
      <section className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 pt-10 pb-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet2 className="w-7 h-7 text-violet-500" />
              <span>Mes finances</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Le module Finances est en cours de refonte pour vous permettre de
              suivre encore mieux vos comptes, vos flux et vos performances.
            </p>
          </div>

          {/* Carte "maintenance en cours" */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 shadow-sm">
            {/* Liseré décoratif à gauche */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 via-emerald-500 to-amber-400" />

            <div className="relative flex flex-col md:flex-row gap-6 md:gap-10 px-6 sm:px-8 md:px-10 py-6 sm:py-8">
              {/* Icône principale */}
              <div className="flex-shrink-0 flex items-start">
                <div className="inline-flex items-center justify-center rounded-2xl bg-violet-600/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-200 p-3">
                  <Wrench className="w-7 h-7" />
                </div>
              </div>

              {/* Texte */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Maintenance en cours
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 dark:bg-amber-500/15 text-amber-800 dark:text-amber-100 px-3 py-1 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Module temporairement indisponible</span>
                  </span>
                </div>

                <p className="mt-3 text-sm sm:text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl">
                  Nous retravaillons l’architecture du module Finances&nbsp;:
                  gestion des comptes, catégories, vues analytiques et
                  reporting. L’objectif est de vous proposer un suivi plus
                  clair, plus détaillé et plus agréable à utiliser.
                </p>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Pendant cette phase de maintenance, l’accès à vos données
                  financières est mis en pause. Vos informations existantes sont
                  conservées en toute sécurité et seront intégrées dans la
                  nouvelle version du module.
                </p>

                {/* Infos complémentaires */}
                <div className="mt-5 inline-flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span>
                      Optimisation des calculs, graphiques et filtres avancés en
                      cours.
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                    <span>
                      Revenez bientôt pour découvrir la nouvelle interface.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bas de page */}
          <p className="mt-6 text-xs sm:text-sm text-slate-500 dark:text-slate-500">
            Merci pour votre patience 🙏. Vous pouvez continuer à utiliser les
            autres fonctionnalités de FullMargin pendant que nous finalisons ce
            module.
          </p>
        </div>
      </section>
    </main>
  );
}
