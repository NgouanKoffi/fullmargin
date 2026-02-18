// src/pages/CharteVendeur.tsx
import { motion } from "framer-motion";

export default function CharteVendeur() {
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
          Charte Vendeur — FullMargin
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Cadre, bonnes pratiques et obligations pour vendre sur la Marketplace
          FullMargin.
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
            La présente Charte a pour objectif de définir les règles et bonnes
            pratiques applicables aux vendeurs (ci-après « le Vendeur »)
            souhaitant proposer leurs produits ou services au sein de la
            Marketplace FullMargin, exploitée par{" "}
            <strong>FULL MARGIN LTD</strong>. Elle vise à instaurer un cadre
            fiable, transparent et collaboratif, garantissant la satisfaction
            des acheteurs et la qualité des échanges.
          </p>
        </div>

        {/* 2. Accès à la vente */}
        <div id="acces-vente">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Accès à la vente
          </h2>
          <p className="mb-3">
            Tout vendeur souhaitant publier un produit doit :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>créer un compte vendeur dédié,</li>
            <li>accepter la présente Charte de vente,</li>
            <li>fournir des informations exactes et vérifiables,</li>
            <li>
              respecter les formats techniques imposés (type de fichier,
              visuels, description).
            </li>
          </ul>
          <p>
            FullMargin se réserve la possibilité de vérifier certains produits
            ou informations, afin de s’assurer de leur conformité et de leur
            fiabilité.
          </p>
        </div>

        {/* 3. Produits autorisés */}
        <div id="produits-autorises">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Produits autorisés
          </h2>
          <p className="mb-3">
            Les produits pouvant être proposés incluent (liste non exhaustive) :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>robots de trading (Expert Advisors – EA) pour MT4/MT5,</li>
            <li>indicateurs techniques et scripts personnalisés,</li>
            <li>e-books, guides PDF, stratégies et contenus pédagogiques,</li>
            <li>
              templates Excel ou outils d’aide à la gestion financière et au
              trading,
            </li>
            <li>formations disponibles dans les communautés FullMargin.</li>
          </ul>
          <p className="mt-3 bg-red-100/70 dark:bg-red-500/10 border border-red-200/40 dark:border-red-500/30 text-red-900 dark:text-red-100 rounded-md p-3 text-sm md:text-base">
            ❌ Ne sont pas autorisés : les contenus illégaux, frauduleux,
            contrefaits, ou ne respectant pas les lois applicables.
          </p>
          <p className="mt-3">
            FullMargin s’engage à effectuer des contrôles réguliers et à
            encourager les vendeurs à proposer des produits fiables, utiles et
            bénéfiques pour la communauté.
          </p>
        </div>

        {/* 4. Tarifs et paiements */}
        <div id="tarifs-paiements">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Tarifs et paiements
          </h2>
          <p>
            Le Vendeur fixe librement le prix de ses produits, sous réserve d’un
            prix minimum défini par FullMargin pour maintenir la cohérence de la
            Marketplace. Une commission modeste est prélevée par FullMargin sur
            chaque vente.
          </p>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            👉 Cette commission n’a pas pour but de « taxer » les ventes, mais
            de :
            <br />
            – couvrir les frais liés aux prestataires de paiement (Stripe,
            crypto…),
            <br />
            – assurer la sécurité et la fluidité des transactions,
            <br />– maintenir un écosystème durable et accessible pour
            l’ensemble de la communauté.
          </p>
          <p className="mt-3">
            Les paiements sont gérés via Stripe Connect et/ou d’autres
            partenaires spécialisés. Les revenus nets sont reversés au Vendeur
            après déduction des commissions et frais liés aux transactions.
          </p>
        </div>

        {/* 5. Gestion des licences et sécurité */}
        <div id="licences-securite">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Gestion des licences et sécurité
          </h2>
          <p>
            Pour les robots de trading et indicateurs, FullMargin met à
            disposition un système de gestion des licences automatisé permettant
            :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 mb-3">
            <li>
              de générer et transmettre automatiquement les clés d’accès aux
              utilisateurs,
            </li>
            <li>
              de protéger les droits des vendeurs (anti-copies, contrôle
              d’accès),
            </li>
            <li>
              de simplifier la vie des acheteurs avec une activation immédiate
              et sécurisée.
            </li>
          </ul>
          <p>
            Le Vendeur peut être invité à intégrer un module de code simple dans
            son outil pour faciliter ce processus.
          </p>
        </div>

        {/* 6. Obligations du vendeur */}
        <div id="obligations-vendeur">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Obligations du vendeur
          </h2>
          <p className="mb-3">Le Vendeur s’engage à :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              ne publier que des produits dont il détient les droits ou les
              licences nécessaires,
            </li>
            <li>
              fournir une description claire, honnête et transparente de ses
              produits,
            </li>
            <li>
              assurer un service client de base (installation, réponses simples
              aux utilisateurs),
            </li>
            <li>respecter les lois applicables et la présente Charte.</li>
          </ul>
        </div>

        {/* 7. Obligations de l’acheteur (rappel) */}
        <div id="obligations-acheteur">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Obligations de l’acheteur (rappel)
          </h2>
          <p className="mb-3">L’acheteur doit :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>utiliser les produits pour un usage personnel,</li>
            <li>
              ne pas revendre, copier ou redistribuer les produits sans accord,
            </li>
            <li>
              respecter les conditions techniques (licences, compatibilité,
              installation).
            </li>
          </ul>
        </div>

        {/* 8. Responsabilité et protection des utilisateurs */}
        <div id="responsabilite-protection">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Responsabilité et protection des utilisateurs
          </h2>
          <p>
            FullMargin agit comme un intermédiaire technique entre le Vendeur et
            l’Acheteur. FullMargin ne peut pas être tenu responsable des litiges
            individuels liés à un produit ou service tiers.
          </p>
          <p className="mt-3 bg-indigo-100/70 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded-md p-3 text-sm md:text-base">
            👉 Toutefois, FullMargin met en œuvre plusieurs mécanismes pour
            protéger sa communauté :
            <br />
            – système de signalement et de commentaires,
            <br />
            – vérifications aléatoires ou ciblées de produits,
            <br />
            – politique stricte contre les fraudes et arnaques,
            <br />– accompagnement des utilisateurs en cas de doute ou de
            problème.
          </p>
          <p className="mt-3">
            L’engagement est clair : tout est fait pour que les produits
            proposés soient vérifiés, utiles et fiables.
          </p>
        </div>

        {/* 9. Commissions et fiscalité */}
        <div id="commissions-fiscalite">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Commissions et fiscalité
          </h2>
          <p>
            FullMargin prélève des commissions pour assurer le bon
            fonctionnement de la Marketplace. Ces frais couvrent notamment : la
            gestion des transactions, la sécurité des paiements, et le maintien
            de l’écosystème.
          </p>
          <p className="mt-3">
            Chaque Vendeur reste responsable de ses obligations fiscales
            (déclarations de revenus, TVA, etc.).
          </p>
        </div>

        {/* 10. Résiliation et contrôle */}
        <div id="resiliation-controle">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            10. Résiliation et contrôle
          </h2>
          <p>
            En cas de manquement grave (fraude, non-conformité, abus),
            FullMargin peut suspendre ou supprimer un compte vendeur. Le Vendeur
            peut demander la clôture de son compte à tout moment.
          </p>
        </div>

        {/* 11. Loi applicable */}
        <div id="loi-applicable">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            11. Loi applicable
          </h2>
          <p>
            La présente Charte est régie par le droit anglais. Tout litige sera
            porté devant les tribunaux compétents de Londres.
          </p>
        </div>
      </section>
    </div>
  );
}
