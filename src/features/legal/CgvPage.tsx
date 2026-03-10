// src/pages/CgvMarketplace.tsx
import { motion } from "framer-motion";

export default function CgvMarketplace() {
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
          Conditions Générales de Vente (CGV)
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Marketplace & Vendeurs — ces conditions régissent les ventes,
          abonnements et produits numériques proposés sur FullMargin.
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
            Les présentes Conditions Générales de Vente (ci-après « CGV »)
            régissent les relations contractuelles entre{" "}
            <strong>FULL MARGIN LTD</strong>, exploitant la plateforme
            <span className="whitespace-nowrap"> www.fullmargin.net</span>, et
            tout client (ci-après « l’Utilisateur ») procédant à un achat ou à
            un abonnement sur la plateforme. Toute commande implique
            l’acceptation pleine et entière des présentes CGV.
          </p>
        </div>

        {/* 2. Dispositions spécifiques à la Marketplace */}
        <div id="marketplace">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Dispositions spécifiques à la Marketplace
          </h2>

          <h3 className="font-medium mb-2">Accès à la vente</h3>
          <p className="mb-3">
            Tout vendeur souhaitant publier un produit dans la Marketplace doit
            :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>créer un compte vendeur dédié,</li>
            <li>accepter la Charte de Vente Marketplace,</li>
            <li>
              respecter les formats et critères imposés (fichiers, visuels,
              descriptions…),
            </li>
            <li>
              se soumettre à une vérification préalable si applicable (produits
              sensibles, licences, conformité légale).
            </li>
          </ul>

          <h3 className="font-medium mb-2">Produits concernés</h3>
          <p className="mb-3">
            Les produits proposés peuvent inclure notamment :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>robots de trading (Expert Advisors), indicateurs MT4/MT5,</li>
            <li>e-books, guides PDF, stratégies,</li>
            <li>templates Excel ou autres formats utiles aux traders,</li>
            <li>
              outils personnalisés ou extensions techniques validées par
              FullMargin.
            </li>
          </ul>

          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ FullMargin se réserve le droit de refuser ou retirer tout produit
            non conforme à sa politique interne, jugé trompeur, illégal, ou
            présentant un risque pour les utilisateurs.
          </p>

          <h3 className="font-medium mt-5 mb-2">Prix et paiement</h3>
          <p className="mb-3">
            Le prix est fixé librement par le vendeur, sous réserve d’un prix
            minimum imposé par FullMargin pour garantir la cohérence de la
            Marketplace. FullMargin perçoit une commission fixe ou variable sur
            chaque vente. Les paiements sont traités via Stripe Connect et/ou
            d’autres prestataires partenaires.
          </p>
          <p>
            Le vendeur perçoit ses gains nets après déduction des commissions et
            frais de transaction, selon les modalités de versement du
            prestataire de paiement (délai, vérification KYC, seuils de
            paiement).
          </p>

          <h3 className="font-medium mt-5 mb-2">Obligations du vendeur</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              garantir qu’il détient bien les droits sur le produit mis en
              vente,
            </li>
            <li>fournir une description claire, transparente et véridique,</li>
            <li>respecter la Charte de vente et les lois applicables,</li>
            <li>
              assurer un service client minimal pour ses acheteurs
              (installation, support de base),
            </li>
            <li>
              accepter l’intégration du système de gestion de licences développé
              par FullMargin (automatisation et sécurisation de l’accès aux
              produits).
            </li>
          </ul>

          <h3 className="font-medium mt-5 mb-2">Obligations de l’acheteur</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              utiliser le produit acheté pour un usage personnel uniquement,
            </li>
            <li>
              ne pas revendre, redistribuer ou partager le produit sans
              autorisation expresse,
            </li>
            <li>
              respecter les conditions techniques d’utilisation (installation,
              licences, compatibilité),
            </li>
            <li>
              ne pas exiger de remboursement hors cadre légal ou conditions
              prévues.
            </li>
          </ul>
        </div>

        {/* 3. Tarifs */}
        <div id="tarifs">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Tarifs
          </h2>
          <p>
            Les prix sont indiqués en USD ($) ou dans la devise locale, toutes
            taxes comprises (si applicable). FullMargin se réserve le droit de
            modifier ses tarifs, en fonction de l’évolution des coûts
            techniques, réglementaires ou de marché. Toutefois, les abonnements
            ou achats déjà réglés restent valables jusqu’à la fin de la période
            de service pour laquelle l’Utilisateur a payé.
          </p>
          <p className="mt-3">
            Les utilisateurs ne perdent donc jamais l’accès aux services déjà
            acquis, même en cas de modification tarifaire.
          </p>
        </div>

        {/* 4. Commandes */}
        <div id="commandes">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Commandes
          </h2>
          <p>
            La commande devient ferme et définitive après validation du
            paiement. FullMargin se réserve le droit de refuser une commande en
            cas de litige antérieur ou de suspicion de fraude.
          </p>
        </div>

        {/* 5. Paiements */}
        <div id="paiements">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Paiements
          </h2>
          <p>
            Les paiements sont traités via des prestataires tiers sécurisés.
            FullMargin travaille principalement avec Stripe pour les paiements
            classiques, et avec des prestataires spécialisés permettant les
            paiements en cryptomonnaies (USDT, BTC, ETH, etc.). L’utilisateur
            garantit disposer des autorisations nécessaires pour utiliser le
            mode de paiement choisi.
          </p>
          <p className="mt-3">
            En cas d’abonnement, le prélèvement est récurrent (mensuel,
            trimestriel ou annuel selon l’offre choisie).
          </p>
        </div>

        {/* 6. Livraison des services */}
        <div id="livraison">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Livraison des services
          </h2>
          <p>
            Les produits numériques (robots, indicateurs, e-books) sont livrés
            immédiatement après paiement via téléchargement sécurisé ou
            activation de licence. Les abonnements donnent accès instantanément
            aux services concernés via le tableau de bord utilisateur.
          </p>
          <p className="mt-3">
            Les formations vendues dans les communautés sont accessibles
            directement dans l’espace communautaire lié.
          </p>
        </div>

        {/* 7. Système de sécurité et gestion des licences */}
        <div id="licences">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Système de sécurité et gestion des licences
          </h2>
          <p>
            FullMargin a développé un système de sécurité propriétaire dédié à
            la gestion des licences et connexions pour les robots de trading
            (EA) et indicateurs vendus sur la Marketplace. Ce système permet
            notamment :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 mb-3">
            <li>
              la génération et distribution automatique de clés de licence aux
              acheteurs,
            </li>
            <li>
              la synchronisation en temps réel entre la plateforme et les outils
              installés,
            </li>
            <li>
              la sécurisation des accès afin d’éviter tout usage non autorisé,
            </li>
            <li>
              une expérience fluide pour l’utilisateur, sans intervention
              manuelle.
            </li>
          </ul>
          <p>
            Dans ce cadre, FullMargin peut demander aux concepteurs ou vendeurs
            de robots d’intégrer un module de code dans leurs outils avant leur
            mise en vente, afin de faciliter la gestion des licences, le suivi
            technique et la transmission rapide des accès.
          </p>
          <p className="mt-3">
            Ce dispositif protège à la fois les vendeurs (contrôle des copies
            non autorisées) et les utilisateurs (accès immédiat et garanti à
            leur achat).
          </p>
        </div>

        {/* 8. Droit de rétractation */}
        <div id="retractation">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Droit de rétractation
          </h2>
          <p>
            Pour les produits numériques (robots, indicateurs, e-books), aucun
            droit de rétractation ne peut être exercé après livraison,
            conformément à l’article 16 de la directive 2011/83/UE.
          </p>
          <p className="mt-3">
            Pour les abonnements, l’utilisateur peut résilier à tout moment mais
            les sommes déjà versées restent dues pour la période en cours.
          </p>
        </div>

        {/* 9. Remboursements */}
        <div id="remboursements">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Remboursements
          </h2>
          <p>
            Aucun remboursement n’est accordé pour les produits numériques déjà
            livrés. En cas de dysfonctionnement imputable directement à
            FullMargin (et non lié à un usage ou paramétrage utilisateur), un
            avoir ou un remboursement exceptionnel pourra être envisagé.
          </p>
          <p className="mt-3">
            Pour les produits et services vendus par des tiers dans la
            Marketplace, les demandes de remboursement doivent être adressées
            directement au vendeur tiers concerné.
          </p>
        </div>

        {/* 10. Responsabilités */}
        <div id="responsabilites">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            10. Responsabilités
          </h2>
          <p>
            FullMargin garantit la bonne exécution de ses propres services SaaS.
            FullMargin n’est pas responsable des pertes financières résultant de
            l’utilisation des outils (chaque utilisateur reste seul responsable
            de ses décisions de trading).
          </p>
          <p className="mt-3">
            Concernant la Marketplace, FullMargin agit en tant qu’intermédiaire
            technique et ne peut être tenu responsable de la qualité, de la
            conformité ou de la légalité des produits vendus par des tiers.
          </p>
        </div>

        {/* 11. Contrôle et lutte contre les fraudes */}
        <div id="fraudes">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            11. Contrôle et lutte contre les fraudes
          </h2>
          <p>
            FullMargin met en place un système de signalement, notation et
            modération afin de protéger ses utilisateurs contre les arnaques et
            pratiques abusives. Toute fraude avérée pourra entraîner :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>la suppression immédiate du produit,</li>
            <li>la suspension du compte vendeur,</li>
            <li>voire un signalement aux autorités compétentes.</li>
          </ul>
        </div>

        {/* 12. Propriété intellectuelle */}
        <div id="propriete-intellectuelle">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            12. Propriété intellectuelle
          </h2>
          <p>
            Les produits numériques vendus sont protégés par le droit d’auteur.
            Les licences sont personnelles et limitées. Toute copie, revente ou
            diffusion non autorisée est interdite.
          </p>
        </div>

        {/* 13. Suspension et résiliation */}
        <div id="suspension">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            13. Suspension et résiliation
          </h2>
          <p>
            FullMargin peut suspendre ou supprimer un compte en cas de
            non-respect des présentes CGV. L’utilisateur peut résilier son
            abonnement depuis son espace personnel.
          </p>
        </div>

        {/* 14. Données personnelles */}
        <div id="donnees-personnelles">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            14. Données personnelles
          </h2>
          <p>
            Les données collectées dans le cadre des ventes sont traitées
            conformément à notre Politique de confidentialité.
          </p>
        </div>

        {/* 15. Loi applicable et juridiction */}
        <div id="loi-applicable">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            15. Loi applicable et juridiction
          </h2>
          <p>
            Les présentes CGV sont régies par le droit anglais. Tout litige sera
            porté devant les tribunaux compétents de Londres.
          </p>
        </div>

        {/* 16. Contact */}
        <div id="contact">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            16. Contact
          </h2>
          <p className="mb-3">
            Pour toute question relative aux ventes, abonnements, licences ou
            réclamations, l’utilisateur peut contacter le support FullMargin.
          </p>
          <p>
            📩{" "}
            <a
              href="mailto:support@fullmargin.net"
              className="text-indigo-500 hover:underline"
            >
              support@fullmargin.net
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
