// src/pages/PolitiqueCookies.tsx
import { motion } from "framer-motion";

export default function PolitiqueCookies() {
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
          Politique de Cookies
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
        >
          Comment FullMargin utilise les cookies et technologies similaires sur
          son site.
        </motion.p>
      </section>

      {/* CONTENU */}
      <section className="px-6 pb-20 max-w-4xl mx-auto space-y-10 text-justify leading-relaxed text-base md:text-lg text-gray-800 dark:text-gray-200">
        {/* 1. Objet */}
        <div id="objet">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            1. Objet de la politique
          </h2>
          <p>
            La présente Politique de cookies explique comment{" "}
            <strong>FULL MARGIN LTD</strong> (ci-après « FullMargin », « nous »)
            utilise des cookies et technologies similaires sur le site
            <span className="whitespace-nowrap"> www.fullmargin.net</span> et
            ses sous-domaines. Elle complète notre Politique de confidentialité.
          </p>
        </div>

        {/* 2. Qu'est-ce qu'un cookie ? */}
        <div id="definition">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            2. Qu’est-ce qu’un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte stocké sur l’appareil de
            l’utilisateur (ordinateur, mobile, tablette) lorsqu’il visite un
            site web. Il permet :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>d’assurer le bon fonctionnement du site,</li>
            <li>d’analyser son utilisation,</li>
            <li>de personnaliser l’expérience,</li>
            <li>
              et, le cas échéant, de proposer du contenu publicitaire adapté.
            </li>
          </ul>
        </div>

        {/* 3. Types de cookies */}
        <div id="types">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            3. Types de cookies utilisés
          </h2>

          {/* 3.1 */}
          <div className="space-y-2">
            <h3 className="font-medium text-lg">
              3.1 Cookies strictement nécessaires
            </h3>
            <p>
              Ils permettent l’accès sécurisé aux services. Exemple : connexion
              au compte, maintien de la session utilisateur, vérification des
              licences. Ces cookies sont indispensables et ne peuvent pas être
              désactivés.
            </p>
          </div>

          {/* 3.2 */}
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-lg">
              3.2 Cookies de performance et d’analyse
            </h3>
            <p>
              Utilisés pour mesurer et améliorer les performances du site (ex.
              Google Analytics, logs techniques, monitoring d’erreurs). Ils
              collectent des données anonymisées sur la navigation (pages vues,
              durée des sessions, fréquence d’utilisation des outils).
            </p>
          </div>

          {/* 3.3 */}
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-lg">
              3.3 Cookies de personnalisation
            </h3>
            <p>
              Ils retiennent les préférences utilisateur (langue choisie, mode
              sombre/clair, préférences de trading journal) et permettent
              d’améliorer l’expérience globale.
            </p>
          </div>

          {/* 3.4 */}
          <div className="space-y-2 mt-4">
            <h3 className="font-medium text-lg">
              3.4 Cookies publicitaires et marketing (facultatifs)
            </h3>
            <p>
              Utilisés uniquement si l’utilisateur y consent. Exemple : suivi de
              campagnes marketing, publicité ciblée sur Facebook Ads ou Google
              Ads. Ils permettent de proposer un contenu personnalisé et des
              offres adaptées.
            </p>
          </div>
        </div>

        {/* 4. Technologies similaires */}
        <div id="technologies">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            4. Technologies similaires aux cookies
          </h2>
          <p>Outre les cookies classiques, FullMargin peut utiliser :</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Pixels de suivi (web beacons)</strong> : pour mesurer
              l’efficacité des emails et campagnes.
            </li>
            <li>
              <strong>LocalStorage / SessionStorage</strong> : stockage local
              temporaire d’informations techniques.
            </li>
            <li>
              <strong>SDK mobiles</strong> : pour améliorer l’expérience sur
              mobile.
            </li>
          </ul>
        </div>

        {/* 5. Consentement */}
        <div id="consentement">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            5. Consentement
          </h2>
          <h3 className="font-medium mt-2 mb-1">5.1 Bandeau cookies</h3>
          <p>
            Lors de la première visite, un bandeau informe l’utilisateur de
            l’utilisation de cookies. L’utilisateur peut :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>accepter tous les cookies,</li>
            <li>refuser les cookies non essentiels,</li>
            <li>personnaliser ses choix.</li>
          </ul>

          <h3 className="font-medium mt-4 mb-1">5.2 Gestion des préférences</h3>
          <p>
            L’utilisateur peut modifier ses préférences à tout moment via le
            bandeau de consentement (si réaffiché) ou via les paramètres de son
            navigateur.
          </p>
        </div>

        {/* 6. Durée de conservation */}
        <div id="duree">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            6. Durée de conservation
          </h2>
          <p>
            <strong>Cookies de session :</strong> expirent à la fermeture du
            navigateur.
          </p>
          <p className="mt-2">
            <strong>Cookies persistants :</strong> conservés maximum 13 mois,
            conformément aux exigences légales.
          </p>
          <p className="mt-2">
            Les consentements donnés sont également enregistrés pour une durée
            de 6 mois.
          </p>
        </div>

        {/* 7. Gestion par l'utilisateur */}
        <div id="gestion">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            7. Gestion des cookies par l’utilisateur
          </h2>
          <p>
            L’utilisateur peut configurer son navigateur pour supprimer les
            cookies déjà installés, bloquer certains cookies ou recevoir une
            notification avant l’installation d’un cookie.
          </p>
          <p className="mt-3 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md p-3 text-sm md:text-base">
            ⚠ Attention : la désactivation de certains cookies peut limiter
            l’accès à certaines fonctionnalités de FullMargin (connexion,
            tableau de bord, marketplace).
          </p>
        </div>

        {/* 8. Mise à jour */}
        <div id="maj">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            8. Mise à jour de la politique
          </h2>
          <p>
            FullMargin peut modifier cette Politique de cookies à tout moment
            afin de refléter les évolutions légales, techniques ou
            fonctionnelles. En cas de changement important, une notification
            sera affichée lors de la visite suivante.
          </p>
        </div>

        {/* 9. Contact */}
        <div id="contact">
          <h2 className="font-semibold text-xl mb-3 text-indigo-600">
            9. Contact
          </h2>
          <p className="mb-2">
            Pour toute question concernant cette Politique :
          </p>
          <p>
            📧{" "}
            <a
              href="mailto:privacy@fullmargin.net"
              className="text-indigo-500 hover:underline"
            >
              privacy@fullmargin.net
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
