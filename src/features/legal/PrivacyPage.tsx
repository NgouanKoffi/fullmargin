// src/pages/Confidentialite.tsx
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileText,
  Globe2,
  Lock,
  Server,
  Users,
  Cookie,
  AlertTriangle,
  Mail,
  Database,
} from "lucide-react";

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-9 h-9 items-center justify-center rounded-full ring-1 ring-fm-primary/15 bg-fm-primary/10 text-fm-primary shrink-0">
      {children}
    </div>
  );
}

export default function Confidentialite() {
  return (
    <main className="overflow-x-hidden bg-white dark:bg-[#0f1115] text-skin-base min-h-screen">
      {/* HERO */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center justify-center mx-auto text-[11px] md:text-xs font-semibold px-2 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-surface/70"
          >
            Politique de confidentialité
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-[1.04]"
          >
            Protection de vos données — FullMargin
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 mx-auto max-w-[70ch] text-skin-muted text-base sm:text-lg leading-relaxed"
          >
            Cette politique explique quelles données nous collectons, pourquoi
            nous le faisons, combien de temps nous les conservons et quels sont
            vos droits. Elle s’applique à l’ensemble des services et
            sous-domaines de FullMargin.
          </motion.p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="w-full pb-20">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Objet */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-4">
              <IconCircle>
                <FileText className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  1. Objet de la politique
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Qui traite vos données et sur quelles bases juridiques.
                </p>
              </div>
            </div>
            <p className="leading-relaxed">
              La présente Politique de confidentialité explique comment{" "}
              <strong>FULL MARGIN LTD</strong> (“FullMargin”, “nous”, “notre”)
              collecte, utilise, stocke et protège les données personnelles de
              ses utilisateurs, conformément au <strong>UK GDPR</strong>, au{" "}
              <strong>Data Protection Act 2018</strong>, ainsi qu’aux
              réglementations internationales applicables (RGPD UE, CCPA pour
              les résidents californiens).
            </p>
            <p className="mt-3 leading-relaxed">
              En utilisant la plateforme <strong>www.fullmargin.net</strong> et
              tous ses sous-domaines, vous acceptez les termes de cette
              politique.
            </p>
          </article>

          {/* 2. Données collectées */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-5">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <Database className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  2. Données collectées
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Ce que vous nous donnez et ce que nous captons
                  automatiquement.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">
                2.1 Données fournies volontairement
              </h3>
              <p className="text-sm sm:text-base">
                Lorsque vous créez un compte ou utilisez certaines
                fonctionnalités, vous pouvez fournir :
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>
                  Nom, prénom, adresse e-mail, numéro de téléphone (facultatif)
                </li>
                <li>
                  Informations de facturation (adresse, pays, devise) liées à
                  vos achats ou abonnements
                </li>
                <li>
                  Informations de paiement transmises uniquement à nos
                  prestataires agréés (Stripe, BitPay, NOWPayments)
                </li>
                <li>
                  Données communautaires : contenus publiés dans les espaces
                  communautés (messages, fichiers, lives, formations)
                </li>
                <li>
                  Données commerciales liées aux produits achetés ou vendus sur
                  la Marketplace
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">
                2.2 Données collectées automatiquement
              </h3>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Adresse IP, pays ou localisation approximative</li>
                <li>
                  Type d’appareil et de navigateur, langue, système
                  d’exploitation
                </li>
                <li>Pages consultées, durée de session, origine du trafic</li>
                <li>
                  Données techniques et logs serveur (sécurité, diagnostic,
                  performance)
                </li>
                <li>
                  Données d’interaction avec les outils FullMargin (journaux de
                  trading, notes, tâches, requêtes envoyées à l’IA Fullmetrix)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2.3 Données sensibles</h3>
              <p className="text-sm sm:text-base">
                FullMargin ne collecte <strong>aucune donnée sensible</strong>{" "}
                au sens du RGPD (origine raciale, opinions politiques, santé,
                orientation sexuelle…).
              </p>
            </div>
          </article>

          {/* 3. Finalités */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-4">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <ShieldCheck className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  3. Finalités du traitement
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Pourquoi nous avons besoin de ces données.
                </p>
              </div>
            </div>
            <p>
              Nous utilisons vos données uniquement pour des objectifs légitimes
              :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Fournir, maintenir et améliorer les services FullMargin (SaaS,
                IA, Marketplace)
              </li>
              <li>
                Gérer votre compte, vos abonnements, paiements et licences
              </li>
              <li>
                Assurer la sécurité du site, détecter les fraudes et usages
                abusifs
              </li>
              <li>
                Personnaliser votre expérience et vous proposer des contenus
                adaptés
              </li>
              <li>
                Mettre en relation vendeurs et acheteurs sur la Marketplace
              </li>
              <li>Respecter les obligations légales, comptables et fiscales</li>
              <li>
                Produire des statistiques pour améliorer nos outils (monitoring,
                IA)
              </li>
            </ul>
          </article>

          {/* 4. Base légale */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-4">
              <IconCircle>
                <Globe2 className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  4. Bases légales du traitement
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Ce qui nous autorise à traiter vos données.
                </p>
              </div>
            </div>
            <p className="leading-relaxed">
              Selon le UK GDPR / RGPD, nos traitements reposent sur :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                le <strong>consentement</strong> (inscription newsletter,
                cookies marketing),
              </li>
              <li>
                l’<strong>exécution d’un contrat</strong> (accès à la
                plateforme, achat, abonnement),
              </li>
              <li>
                le <strong>respect d’une obligation légale</strong>{" "}
                (facturation, lutte anti-fraude),
              </li>
              <li>
                l’<strong>intérêt légitime</strong> de FullMargin (sécurisation,
                amélioration continue).
              </li>
            </ul>
          </article>

          {/* 5. Conservation */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-4">
              <IconCircle>
                <Server className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  5. Durée de conservation
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Nous ne gardons pas vos données plus longtemps que nécessaire.
                </p>
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Données de compte : tant que le compte est actif</li>
              <li>Données de facturation : jusqu’à 6 ans (conformité UK)</li>
              <li>Logs techniques / navigation : jusqu’à 12 mois</li>
              <li>
                Données supprimées par l’utilisateur : effacées ou anonymisées
                sous 30 jours
              </li>
            </ul>
          </article>

          {/* 6. Partage */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-4">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <Users className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  6. Partage des données
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Avec qui nous pouvons partager certains éléments.
                </p>
              </div>
            </div>
            <p>
              Nous ne vendons ni ne louons vos données. Elles peuvent toutefois
              être partagées avec :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Prestataires de paiement (Stripe, NOWPayments…) — pas de
                stockage local de CB
              </li>

              <li>
                Outils d’analyse (Google Analytics, monitoring) sous réserve de
                consentement
              </li>
              <li>Autorités légales en cas d’obligation ou de procédure</li>
            </ul>
            <p className="text-sm text-skin-muted">
              FullMargin ne revend jamais les données à des tiers commerciaux.
            </p>
          </article>

          {/* 7. Sécurité */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-4">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <Lock className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  7. Sécurité des données
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Les mesures que nous appliquons.
                </p>
              </div>
            </div>
            <p>
              Nous appliquons une politique stricte de sécurité technique et
              organisationnelle :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement SSL/TLS (HTTPS) sur toutes les communications</li>
              <li>Hashage sécurisé des mots de passe (bcrypt / scrypt)</li>
              <li>Authentification renforcée (2FA en option)</li>
              <li>Détection d’intrusion, journalisation des accès</li>
              <li>Sauvegardes chiffrées et stockage redondant</li>
              <li>Principe du moindre privilège pour les accès internes</li>
            </ul>
            <p className="flex gap-2 items-start text-sm text-orange-500 mt-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>
                Aucun système n’est invulnérable à 100 %. Nous faisons le
                maximum pour réduire les risques.
              </span>
            </p>
          </article>

          {/* 8. Transferts */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-4">
              <IconCircle>
                <Globe2 className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  8. Transferts internationaux
                </h2>
              </div>
            </div>
            <p className="leading-relaxed">
              Certaines données peuvent être transférées en dehors du
              Royaume-Uni ou de l’EEE (par exemple vers des prestataires aux
              États-Unis). Dans ce cas, nous utilisons les{" "}
              <strong>clauses contractuelles types (SCCs)</strong> ou un
              mécanisme reconnu garantissant un niveau de protection adéquat.
            </p>
          </article>

          {/* 9. Droits */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-3">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <ShieldCheck className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  9. Vos droits
                </h2>
                <p className="text-skin-muted text-sm mt-1">
                  Vous gardez le contrôle sur vos informations.
                </p>
              </div>
            </div>
            <p>
              Conformément au RGPD / UK GDPR, vous pouvez exercer à tout moment
              :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le droit d’accès à vos données</li>
              <li>Le droit de rectification ou de suppression</li>
              <li>Le droit à la portabilité</li>
              <li>Le droit d’opposition ou de limitation d’un traitement</li>
            </ul>
          </article>

          {/* 10. Cookies */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8 space-y-3">
            <div className="flex gap-3 items-start">
              <IconCircle>
                <Cookie className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  10. Cookies et traceurs
                </h2>
              </div>
            </div>
            <p>
              Nous utilisons des cookies techniques (sécurité, sessions),
              analytiques (performance, audience) et, avec votre consentement,
              des cookies de personnalisation ou marketing. Vous pouvez les
              gérer à tout moment via le bandeau de consentement ou les
              paramètres du navigateur.
            </p>
          </article>

          {/* 11. Mineurs */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-3">
              <IconCircle>
                <Users className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  11. Mineurs
                </h2>
              </div>
            </div>
            <p>
              Les services FullMargin ne sont pas destinés aux personnes de
              moins de 18 ans. Nous ne collectons pas volontairement de données
              auprès de mineurs ; si c’est le cas, elles seront supprimées.
            </p>
          </article>

          {/* 12. Modifications */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-3">
              <IconCircle>
                <FileText className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  12. Modifications de la politique
                </h2>
              </div>
            </div>
            <p>
              FullMargin peut mettre à jour la présente politique à tout moment.
              En cas de modification substantielle, une notification sera
              affichée sur la plateforme ou envoyée par e-mail. Nous vous
              invitons à la consulter régulièrement.
            </p>
          </article>

          {/* 13. Contact */}
          <article className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <div className="flex gap-3 items-start mb-3">
              <IconCircle>
                <Mail className="w-4 h-4" />
              </IconCircle>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  13. Contact
                </h2>
              </div>
            </div>
            <p className="leading-relaxed">
              Responsable de traitement : <strong>FULL MARGIN LTD</strong>
              <br />
              Siège social :{" "}
              <strong>5 Brayford Square, Londres, E1 0SG, Royaume-Uni</strong>
            </p>
            <p className="mt-2">
              Pour toute question ou exercice de droit :{" "}
              <a
                href="mailto:privacy@fullmargin.net"
                className="text-fm-primary hover:underline"
              >
                privacy@fullmargin.net
              </a>
            </p>
          </article>
        </div>
      </section>

      <style>{`summary::-webkit-details-marker{display:none}`}</style>
    </main>
  );
}
