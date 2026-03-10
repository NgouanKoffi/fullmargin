// src/pages/PolitiqueRemboursement.tsx
import { motion } from "framer-motion";

export default function PolitiqueRemboursement() {
  return (
    <div className="bg-white dark:bg-[#0f1115] text-gray-900 dark:text-gray-100 min-h-screen">
      {/* HERO */}
      <section className="px-6 pt-20 pb-10 text-center">
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
        >
          Politique de Remboursement
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Règles appliquées aux abonnements, produits numériques et formations
          vendus sur FullMargin.net.
        </motion.p>
      </section>

      {/* CONTENU */}
      <section className="px-6 pb-20 max-w-4xl mx-auto space-y-10 text-justify leading-relaxed text-base md:text-lg text-gray-800 dark:text-gray-200">
        {/* 1. Objet */}
        <div id="objet">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            1. Objet
          </h2>
          <p>
            La présente Politique de remboursement a pour objectif d’informer
            les utilisateurs de <strong>FULL MARGIN LTD</strong> (ci-après «
            FullMargin » ou « la Société ») des conditions applicables aux
            demandes de remboursement liées aux services, abonnements et
            produits numériques vendus sur la plateforme{" "}
            <span className="whitespace-nowrap">FullMargin.net</span>.
          </p>
          <p className="mt-3">
            Notre mission est de garantir une expérience claire et sécurisée à
            l’ensemble de nos utilisateurs, tout en protégeant l’écosystème de
            la plateforme et le travail des vendeurs.
          </p>
        </div>

        {/* 2. Champ d’application */}
        <div id="champ-application">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Champ d’application
          </h2>
          <p className="mb-3">Cette Politique s’applique à :</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              les abonnements FullMargin (accès SaaS aux outils et
              fonctionnalités premium),
            </li>
            <li>
              les produits numériques vendus dans la Marketplace (robots,
              indicateurs, e-books, templates…),
            </li>
            <li>
              les formations ou services vendus par les créateurs au sein des
              communautés FullMargin.
            </li>
          </ul>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ Important : FullMargin agit comme intermédiaire technique dans le
            cadre des ventes réalisées par les vendeurs tiers. Les conditions
            spécifiques de remboursement peuvent donc varier selon le produit,
            le vendeur ou le type de service.
          </p>
        </div>

        {/* 3. Remboursements sur les abonnements */}
        <div id="abonnements">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Remboursements sur les abonnements FullMargin
          </h2>
          <p>
            Les abonnements premium sont facturés par période (mensuelle ou
            annuelle). Une fois la période commencée, aucun remboursement n’est
            effectué, sauf cas exceptionnels (voir section 6).
          </p>
          <p className="mt-3">
            En cas de résiliation anticipée, l’utilisateur conserve son accès
            jusqu’à la fin de la période déjà réglée.
          </p>
          <p className="mt-3 bg-indigo-100/70 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded-md p-3 text-sm md:text-base">
            👉 Concrètement : un utilisateur qui annule son abonnement en cours
            de mois conserve l’accès jusqu’à la fin du mois payé.
          </p>
        </div>

        {/* 4. Produits numériques */}
        <div id="produits-numeriques">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Remboursements sur les produits numériques (Marketplace)
          </h2>
          <p>
            Les produits numériques (robots, indicateurs, e-books, etc.) sont
            généralement <strong>non remboursables</strong>, car ils sont
            considérés comme des contenus numériques immédiatement consommables.
          </p>
          <p className="mt-3">Exceptions possibles :</p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>produit non fonctionnel ou gravement défectueux,</li>
            <li>produit non conforme à sa description,</li>
            <li>
              erreur technique imputable à FullMargin (ex. : licence non
              délivrée malgré le paiement).
            </li>
          </ul>
          <p>
            Dans ces cas, l’utilisateur peut effectuer une réclamation via le
            système de support FullMargin.
          </p>
        </div>

        {/* 5. Formations et services */}
        <div id="formations-services">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Remboursements sur les formations et services (Communautés)
          </h2>
          <p>
            Les formations et services vendus au sein des Communautés FullMargin
            sont gérés par les formateurs/vendeurs eux-mêmes.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 mb-3">
            <li>
              FullMargin n’est pas directement responsable de la politique de
              remboursement,
            </li>
            <li>
              toutefois, un système de signalement et de médiation est
              disponible en cas de litige,
            </li>
            <li>
              les vendeurs sont encouragés à proposer des conditions claires et
              équitables.
            </li>
          </ul>
        </div>

        {/* 6. Cas exceptionnels */}
        <div id="cas-exceptionnels">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Cas exceptionnels donnant lieu à remboursement
          </h2>
          <p>Un remboursement pourra être accordé dans les cas suivants :</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>fraude avérée sur le compte utilisateur,</li>
            <li>double facturation ou erreur technique de paiement,</li>
            <li>
              problème majeur empêchant l’accès aux services essentiels de
              FullMargin,
            </li>
            <li>
              produit marketplace ou formation signalé comme frauduleux, après
              enquête et validation par l’équipe FullMargin.
            </li>
          </ul>
        </div>

        {/* 7. Processus de demande */}
        <div id="processus">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Processus de demande de remboursement
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              L’utilisateur soumet une demande de remboursement via le support
              FullMargin (formulaire ou email).
            </li>
            <li>
              La demande doit inclure : numéro de transaction, description du
              problème, captures d’écran éventuelles.
            </li>
            <li>
              FullMargin procède à une analyse de la situation (délai moyen : 7
              à 14 jours ouvrés).
            </li>
            <li>
              En cas d’acceptation, le remboursement est effectué via le même
              moyen de paiement que la transaction initiale.
            </li>
          </ol>
        </div>

        {/* 8. Délais de remboursement */}
        <div id="delais">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Délais de remboursement
          </h2>
          <p>
            Une fois validé, le remboursement est généralement traité sous 7 à
            10 jours ouvrés. Les délais peuvent varier selon le prestataire de
            paiement utilisé (paiement par carte, crypto, etc.).
          </p>
        </div>

        {/* 9. Produits exclus */}
        <div id="exclusions">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Produits exclus du remboursement
          </h2>
          <p className="mb-3">Ne donnent pas lieu à remboursement :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>les abonnements ou services déjà entamés,</li>
            <li>
              les produits numériques téléchargés et activés (robots,
              indicateurs, e-books),
            </li>
            <li>
              les services consommés ou partiellement réalisés (coaching,
              formation live).
            </li>
          </ul>
        </div>

        {/* 10. Engagement de FullMargin */}
        <div id="engagement">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            10. Engagement de FullMargin
          </h2>
          <p>
            Même si FullMargin agit principalement comme intermédiaire
            technique, nous nous engageons à :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>vérifier les réclamations avec sérieux et impartialité,</li>
            <li>protéger nos utilisateurs contre les fraudes,</li>
            <li>assurer la transparence dans chaque étape du processus,</li>
            <li>
              encourager les vendeurs à proposer une politique claire et
              respectueuse des acheteurs.
            </li>
          </ul>
        </div>

        {/* 11. Loi applicable */}
        <div id="loi-applicable">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            11. Loi applicable
          </h2>
          <p>
            La présente Politique est régie par le droit anglais. En cas de
            litige, une médiation pourra être proposée avant tout recours
            judiciaire.
          </p>
        </div>
      </section>
    </div>
  );
}
