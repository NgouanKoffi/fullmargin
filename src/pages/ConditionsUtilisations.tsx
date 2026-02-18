// src/pages/Conditions.tsx
import { motion } from "framer-motion";

export default function Conditions() {
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
          Conditions Générales d’Utilisation (CGU)
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Ces conditions encadrent l’accès et l’utilisation de la plateforme
          FullMargin (www.fullmargin.net). En utilisant le site, vous les
          acceptez sans réserve.
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
            Les présentes Conditions Générales d’Utilisation (CGU) ont pour
            objet de définir les modalités d’accès et d’utilisation des services
            proposés sur la plateforme FullMargin (www.fullmargin.net). En
            accédant au site ou en utilisant les services, l’utilisateur
            reconnaît avoir pris connaissance des présentes CGU et les accepter
            sans réserve.
          </p>
        </div>

        {/* 2. Services proposés */}
        <div id="services-proposes">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Services proposés
          </h2>
          <p className="mb-3">
            FullMargin est une plateforme et marketplace qui fournit aux
            utilisateurs :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              des outils numériques de productivité (prise de notes, gestion de
              tâches, finances, agenda, outils de concentration),
            </li>
            <li>
              des outils spécialisés pour les traders (journal de trading, Risk
              Calculator, graphiques, analyse de stratégies, backtesting),
            </li>
            <li>
              une intelligence artificielle (FullMetrics) pour l’assistance,
              l’optimisation des stratégies et l’automatisation de certaines
              actions,
            </li>
            <li>
              un espace communautaire permettant aux utilisateurs de créer,
              gérer et monétiser leur communauté (formations, lives,
              abonnements),
            </li>
            <li>
              une marketplace pour vendre ou acheter des indicateurs, robots de
              trading, ebooks et autres ressources digitales,
            </li>
            <li>
              un espace audio (podcasts, méditation, inspiration, cours, etc.).
            </li>
          </ul>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ FullMargin n’est pas un courtier et ne fournit aucun service de
            gestion de capitaux ni de conseil en investissement.
          </p>
        </div>

        {/* 3. Accès aux services */}
        <div id="acces">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Accès aux services
          </h2>
          <p>
            L’accès aux services nécessite la création d’un compte utilisateur.
            L’utilisateur s’engage à fournir des informations exactes, complètes
            et à jour lors de son inscription. L’accès peut être gratuit ou
            soumis à un abonnement payant (SaaS, premium, marketplace, etc.).
          </p>
          <p className="mt-3">
            FullMargin se réserve le droit de refuser ou de suspendre un compte
            en cas de non-respect des présentes CGU ou de comportement abusif.
          </p>
        </div>

        {/* 4. Obligations des utilisateurs */}
        <div id="obligations">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Obligations des utilisateurs
          </h2>
          <p className="mb-3">
            En utilisant la plateforme, l’utilisateur s’engage à :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              ne pas utiliser FullMargin à des fins illégales, frauduleuses ou
              contraires à l’ordre public,
            </li>
            <li>
              respecter les droits de propriété intellectuelle de FullMargin et
              des autres utilisateurs,
            </li>
            <li>
              ne pas diffuser de contenu offensant, diffamatoire, haineux,
              pornographique ou contraire aux lois,
            </li>
            <li>
              ne pas tenter d’accéder de manière non autorisée aux systèmes,
              bases de données ou API de la plateforme,
            </li>
            <li>
              ne pas revendre, partager ou transférer son compte utilisateur
              sans autorisation.
            </li>
          </ul>
        </div>

        {/* 5. Responsabilités */}
        <div id="responsabilites">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Responsabilités
          </h2>
          <p>
            L’utilisateur reste seul responsable de ses décisions de trading et
            de l’utilisation des outils mis à disposition. FullMargin ne pourra
            être tenu responsable des pertes financières directes ou indirectes
            résultant de l’utilisation de ses services.
          </p>
          <p className="mt-3">
            Les outils, analyses et recommandations générées par l’IA sont
            fournis à titre informatif et éducatif uniquement.
          </p>
          <p className="mt-3">
            La disponibilité du site peut être temporairement interrompue pour
            maintenance ou amélioration sans préavis.
          </p>
        </div>

        {/* 6. Marketplace et communautés */}
        <div id="marketplace">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Marketplace et communautés
          </h2>
          <p className="mb-3">
            FullMargin met à disposition une Marketplace et un système de
            Communautés privées ou publiques permettant aux utilisateurs de
            proposer des produits ou services digitaux tels que :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>robots de trading (EA), indicateurs, ebooks, templates,</li>
            <li>formations en ligne, sessions de coaching, lives,</li>
            <li>abonnements premium à une communauté.</li>
          </ul>
          <p className="font-medium mb-2">Responsabilité :</p>
          <p className="mb-3">
            FullMargin agit uniquement comme intermédiaire technique. Chaque
            vendeur est pleinement responsable de la qualité, de la légalité et
            de la conformité des produits ou services qu’il propose. FullMargin
            ne saurait être tenu responsable des litiges commerciaux entre
            vendeurs et acheteurs.
          </p>
          <p className="font-medium mb-2">
            Mesures de protection mises en place :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>
              mise à disposition d’un système de commentaires et de notations,
            </li>
            <li>
              outil de signalement permettant d’alerter sur tout contenu ou
              pratique suspecte,
            </li>
            <li>dispositif de détection de mots clés ou sensibles,</li>
            <li>
              analyse des retours et avis afin de surveiller la qualité des
              produits et services proposés,
            </li>
            <li>
              droit de suspendre ou supprimer un compte vendeur en cas de
              pratiques frauduleuses ou contraires à l’éthique.
            </li>
          </ul>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ Cela signifie que même si FullMargin ne garantit pas directement
            la qualité des services ou formations proposés par les utilisateurs,
            des mécanismes concrets sont mis en place pour protéger la
            communauté et limiter les abus.
          </p>
        </div>

        {/* 7. Tarifs et paiements */}
        <div id="tarifs">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Tarifs et paiements
          </h2>
          <p className="mb-3">
            Une grande partie des services de FullMargin est accessible
            gratuitement, afin d’accompagner les traders et créateurs dans leur
            progression. Certaines fonctionnalités avancées, outils ou services
            sont accessibles via :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>un abonnement récurrent,</li>
            <li>un paiement unique,</li>
            <li>
              ou via la Marketplace (produits et formations vendus par d’autres
              utilisateurs).
            </li>
          </ul>
          <p className="font-medium mb-2">Prestataires de paiement :</p>
          <p className="mb-3">
            Les paiements sont traités par des prestataires tiers spécialisés
            (Stripe, NOWPayments, etc.). FullMargin ne stocke ni n’enregistre
            directement les données bancaires des utilisateurs.
          </p>
          <p className="font-medium mb-2">Sécurité et transparence :</p>
          <p className="mb-3">
            Tous les paiements sont sécurisés via des solutions conformes aux
            standards internationaux (PCI DSS, cryptage SSL). En cas de paiement
            refusé ou d’impayé, l’accès aux services payants pourra être
            suspendu.
          </p>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ FullMargin n’impose pas d’engagement caché : les abonnements
            peuvent être annulés par l’utilisateur conformément aux conditions
            de résiliation précisées dans les CGU.
          </p>
        </div>

        {/* 8. Propriété intellectuelle */}
        <div id="propriete-intellectuelle">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Propriété intellectuelle
          </h2>
          <p>
            Les contenus, logiciels, graphiques, logos, podcasts et données
            fournis par FullMargin restent sa propriété exclusive. L’utilisateur
            conserve la propriété des contenus qu’il publie dans ses notes,
            communautés ou formations, mais accorde à FullMargin une licence
            d’utilisation limitée pour l’hébergement et la diffusion.
          </p>
        </div>

        {/* 9. Données personnelles */}
        <div id="donnees-personnelles">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Données personnelles
          </h2>
          <p>
            Les données collectées sont traitées conformément à notre Politique
            de confidentialité. L’utilisateur peut exercer ses droits d’accès,
            de rectification et de suppression à tout moment.
          </p>
        </div>

        {/* 10. Durée et résiliation */}
        <div id="duree-resiliation">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            10. Durée et résiliation
          </h2>
          <p>
            Les présentes CGU s’appliquent pour une durée indéterminée dès la
            création du compte. L’utilisateur peut supprimer son compte à tout
            moment via son espace personnel ou sur demande par email. FullMargin
            se réserve le droit de suspendre ou supprimer un compte en cas de
            manquement aux CGU.
          </p>
        </div>

        {/* 11. Modifications des CGU */}
        <div id="modifications">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            11. Modifications des CGU
          </h2>
          <p>
            FullMargin se réserve le droit de modifier les présentes CGU à tout
            moment. Les utilisateurs seront informés par notification ou email
            en cas de modification importante. La poursuite de l’utilisation des
            services vaut acceptation des nouvelles conditions.
          </p>
        </div>

        {/* 12. Loi applicable et juridiction */}
        <div id="loi-applicable">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            12. Loi applicable et juridiction
          </h2>
          <p>
            Les présentes CGU sont régies par le droit anglais. Tout litige
            relatif à leur exécution ou interprétation relève des tribunaux
            compétents du siège social de FULL MARGIN LTD.
          </p>
        </div>

        {/* 13. Informations légales obligatoires */}
        <div id="infos-legales">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            13. Informations légales obligatoires
          </h2>
          <p className="mb-2">
            <span className="font-medium">Éditeur du site :</span> FULL MARGIN
            LTD
          </p>
          <p className="mb-2">
            <span className="font-medium">Forme juridique :</span> Private
            Limited Company (LTD)
          </p>
          <p className="mb-2">
            <span className="font-medium">Numéro d’immatriculation :</span>{" "}
            16705988
          </p>
          <p className="mb-2">
            <span className="font-medium">Pays d’immatriculation :</span>{" "}
            Angleterre et Pays de Galles
          </p>
          <p className="mb-2">
            <span className="font-medium">Siège social :</span> 5 Brayford
            Square, Londres, E1 0SG, Royaume-Uni
          </p>
          <p className="mb-2">
            <span className="font-medium">Email :</span>{" "}
            <a
              href="mailto:support@fullmargin.net"
              className="text-indigo-500 hover:underline"
            >
              support@fullmargin.net
            </a>
          </p>
          {/* <p className="mt-4 mb-2">
            <span className="font-medium">Hébergeur du site :</span> Hostinger
            International Ltd.
          </p>
          <p className="mb-2">61 Lordou Vironos Street, 6023 Larnaca, Chypre</p> */}
        </div>
      </section>
    </div>
  );
}
