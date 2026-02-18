// src/pages/MentionsLegales.tsx
import { motion } from "framer-motion";

export default function MentionsLegales() {
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
          Mentions légales
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Informations sur l’éditeur, l’hébergeur et les règles d’utilisation de
          la plateforme FullMargin.
        </motion.p>
      </section>

      {/* CONTENU */}
      <section className="px-6 pb-20 max-w-4xl mx-auto space-y-10 text-justify leading-relaxed text-base md:text-lg text-gray-800 dark:text-gray-200">
        {/* Intro */}
        <div>
          <p>
            Bienvenue sur la plateforme FullMargin. Les présentes mentions
            légales ont pour objet d’informer les utilisateurs de l’identité de
            l’éditeur du site, de l’hébergeur, ainsi que des règles
            d’utilisation et de responsabilité liées à l’accès et à l’usage de
            nos services.
          </p>
        </div>

        {/* 1. Présentation de l’activité */}
        <div id="presentation">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            1. Présentation de l’activité
          </h2>
          <p>
            FullMargin est une plateforme SaaS innovante destinée aux traders et
            aux web entrepreneurs. Notre mission est de créer un écosystème
            complet qui regroupe en un seul espace :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 mb-3">
            <li>
              des outils d’organisation et de productivité (prise de notes,
              gestion de tâches, finances, agenda, deep focus, data trackers,
              etc.),
            </li>
            <li>
              des outils spécialisés pour les traders (journal de trading,
              analyse de stratégies, graphiques en temps réel, indicateurs, Risk
              Calculator, backtesting, etc.),
            </li>
            <li>
              un espace communautaire où chaque utilisateur peut créer, animer
              et monétiser sa propre communauté (formations, accès payants,
              lives interactifs),
            </li>
            <li>
              une marketplace digitale permettant la vente d’outils ou EA,
              d’indicateurs, d’ebooks, etc.,
            </li>
            <li>
              une intelligence artificielle dédiée (FullMetrix), qui assiste les
              utilisateurs dans leur analyse et la gestion de leurs stratégies.
            </li>
          </ul>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ Important : FullMargin n’est pas un courtier (broker) et ne
            propose aucun service de gestion de capitaux ni de conseil en
            investissement. Les utilisateurs gardent toujours la responsabilité
            totale de leurs décisions de trading et conservent leurs fonds chez
            leurs propres brokers.
          </p>
        </div>

        {/* 2. Propriété intellectuelle */}
        <div id="propriete-intellectuelle">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Propriété intellectuelle
          </h2>
          <p>
            Tous les éléments présents sur le site (textes, images, graphismes,
            logos, vidéos, podcasts, codes sources, logiciels, bases de données,
            etc.) sont protégés par le droit d’auteur et par la législation sur
            la propriété intellectuelle.
          </p>
          <p className="mt-3">
            Toute reproduction, modification, distribution ou exploitation non
            autorisée est interdite et pourra donner lieu à des poursuites. Les
            marques, logos et noms commerciaux utilisés par FullMargin sont
            déposés ou protégés par leurs titulaires respectifs.
          </p>
        </div>

        {/* 3. Responsabilité de l’éditeur */}
        <div id="responsabilite">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Responsabilité de l’éditeur
          </h2>
          <p>
            FullMargin s’engage à fournir un service de qualité, accessible et
            sécurisé. Toutefois :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 mb-3">
            <li>
              nous ne pouvons garantir l’absence totale d’erreurs, de bugs ou
              d’interruptions,
            </li>
            <li>
              nous ne saurions être responsables des pertes financières liées à
              l’utilisation de nos outils ou aux décisions de trading des
              utilisateurs,
            </li>
            <li>
              les informations, analyses et suggestions générées par l’IA ou les
              outils de la plateforme sont fournies à titre informatif et
              éducatif uniquement.
            </li>
          </ul>
          <p>
            L’utilisateur reste seul responsable de l’utilisation de nos
            services et de ses choix en matière de trading ou d’investissement.
          </p>
        </div>

        {/* 4. Utilisation des données personnelles */}
        <div id="donnees-personnelles">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Utilisation des données personnelles
          </h2>
          <p>
            La gestion des données est encadrée par notre Politique de
            confidentialité. Les données collectées (informations de compte,
            facturation, usage des outils, etc.) sont utilisées uniquement pour
            assurer le fonctionnement des services et améliorer l’expérience
            utilisateur. Elles ne sont jamais revendues à des tiers.
          </p>
          <p className="mt-3">
            L’utilisateur dispose de droits d’accès, de rectification,
            d’opposition et de suppression de ses données, conformément au UK
            GDPR. Pour en savoir plus, consultez notre Politique de
            confidentialité.
          </p>
        </div>

        {/* 5. Cookies et traceurs */}
        <div id="cookies">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Cookies et traceurs
          </h2>
          <p>
            Le site utilise des cookies strictement nécessaires au bon
            fonctionnement (authentification, sécurité, gestion de licences).
            Certains cookies peuvent également être utilisés pour mesurer
            l’audience ou personnaliser l’expérience, sous réserve du
            consentement de l’utilisateur, conformément à la réglementation
            (PECR / UK GDPR).
          </p>
          <p className="mt-3">
            Un bandeau d’information permet d’accepter, refuser ou personnaliser
            les cookies.
          </p>
        </div>

        {/* 6. Liens vers des sites tiers */}
        <div id="liens-tiers">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Liens vers des sites tiers
          </h2>
          <p>
            La plateforme peut contenir des liens vers des sites ou services
            tiers. FullMargin n’exerce aucun contrôle sur ces ressources
            externes et décline toute responsabilité concernant leur contenu,
            leurs pratiques ou leurs politiques.
          </p>
        </div>

        {/* 7. Service client et contact */}
        <div id="contact">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Service client et contact
          </h2>
          <p className="mb-3">
            Pour toute question, assistance ou réclamation, vous pouvez nous
            contacter :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Support général :{" "}
              <a
                href="mailto:support@fullmargin.net"
                className="text-indigo-500 hover:underline"
              >
                support@fullmargin.net
              </a>
            </li>
            <li>
              Protection des données :{" "}
              <a
                href="mailto:privacy@fullmargin.net"
                className="text-indigo-500 hover:underline"
              >
                privacy@fullmargin.net
              </a>
            </li>
            <li>
              Réclamations Marketplace :{" "}
              <a
                href="mailto:marketplace@fullmargin.net"
                className="text-indigo-500 hover:underline"
              >
                marketplace@fullmargin.net
              </a>
            </li>
          </ul>
          <p className="mt-3">
            Nous nous efforçons de répondre à toutes les demandes dans un délai
            de 48 heures ouvrées.
          </p>
        </div>

        {/* 8. Droit applicable et juridiction */}
        <div id="droit-applicable">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Droit applicable et juridiction
          </h2>
          <p>
            Les présentes mentions légales sont soumises au droit anglais. En
            cas de litige, et sauf dispositions contraires de la loi, les
            juridictions compétentes seront celles du ressort du siège social de
            la société.
          </p>
        </div>

        {/* 9. Informations légales obligatoires */}
        <div id="infos-legales">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Informations légales obligatoires
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
        </div>
      </section>
    </div>
  );
}
