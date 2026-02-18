// src/pages/FAQ.tsx
import React, { useMemo } from "react";
import {
  HelpCircle,
  Building2,
  BadgeCheck,
  CreditCard,
  Store,
  ShieldCheck,
  Wallet,
  Undo2,
  Bot,
  Lock,
  UserRound,
  Users,
  Share2,
  LifeBuoy,
  FileText,
  ArrowRight,
  Network,
} from "lucide-react";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

type FaqItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    title: "Qu’est-ce que FullMargin ?",
    icon: HelpCircle,
    content: (
      <div className="space-y-3">
        <p>
          FullMargin est une plateforme tout-en-un qui propose un écosystème
          complet pour les traders et les web entrepreneurs. L’objectif est
          simple : centraliser dans un seul espace tous les outils nécessaires
          pour progresser, gagner en discipline et améliorer sa performance.
        </p>
        <p>Sur FullMargin, vous trouverez :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Des outils d’organisation : prise de notes, gestion des tâches,
            suivi des finances.
          </li>
          <li>
            Un journal de trading intelligent manuel et automatique, pour suivre
            vos opérations et générer des analyses automatiques.
          </li>
          <li>
            Fullmetrix, notre intelligence artificielle spécialisée dans le
            trading, intégrée à plusieurs outils.
          </li>
          <li>
            Des graphiques et modules d’analyse en temps réel pour observer et
            backtester vos stratégies.
          </li>
          <li>
            Un système d’agent IA connecté à vos comptes de trading pour
            exécuter certaines requêtes (fermeture de trades, stop loss, etc.).
          </li>
          <li>
            Des outils IA complémentaires conçus pour accompagner les traders
            dans leur discipline et leurs décisions.
          </li>
          <li>
            Un espace Communauté pour créer, animer et monétiser sa propre
            audience, vendre ses services et organiser des lives.
          </li>
          <li>
            Une Marketplace pour acheter et vendre des indicateurs, robots,
            e-books et autres ressources numériques.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "FullMargin est-il un broker ?",
    icon: Building2,
    content: (
      <div className="space-y-3">
        <p>
          Non. FullMargin n’est pas un broker et n’accepte aucun dépôt d’argent
          destiné au trading. Nous ne sommes pas non plus une plateforme
          d’investissement financier. Nous fournissons uniquement des outils
          technologiques, éducatifs et organisationnels pour aider les traders à
          mieux s’organiser et à performer.
        </p>
      </div>
    ),
  },
  {
    title: "La plateforme est-elle gratuite ?",
    icon: BadgeCheck,
    content: (
      <div className="space-y-3">
        <p>
          Oui. Une grande partie de nos outils sont entièrement gratuits et ont
          été développés pour aider la communauté des traders.
        </p>
        <p>
          Certaines fonctionnalités plus avancées sont disponibles via un
          abonnement premium, afin de permettre aux traders de professionnaliser
          leur activité et de profiter du meilleur de nos technologies (IA,
          analyses avancées, journaux automatiques, etc.).
        </p>
      </div>
    ),
  },
  {
    title: "Comment fonctionne la Marketplace ?",
    icon: Store,
    content: (
      <div className="space-y-3">
        <p>
          La Marketplace est un espace dédié où les traders et créateurs peuvent
          vendre ou acheter des :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>robots de trading,</li>
          <li>indicateurs,</li>
          <li>e-books,</li>
          <li>formations et ressources numériques.</li>
        </ul>
        <p>
          Nous avons conçu un système de sécurité sophistiqué qui gère
          automatiquement les licences et clés d’accès pour les outils (comme
          les EAs et indicateurs). Ainsi, l’utilisateur reçoit rapidement son
          produit, et le vendeur garde un contrôle optimal sur ses licences.
        </p>
      </div>
    ),
  },
  {
    title: "Quelle garantie ai-je en tant qu’acheteur ?",
    icon: ShieldCheck,
    content: (
      <div className="space-y-3">
        <p>
          Même si FullMargin agit comme intermédiaire technique, nous mettons
          tout en œuvre pour sécuriser vos achats :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Vérification préalable des produits,</li>
          <li>
            Système de signalement et de commentaires pour identifier rapidement
            les fraudes,
          </li>
          <li>Contrôle qualité et suivi des retours utilisateurs,</li>
          <li>Support réactif en cas de litige.</li>
        </ul>
        <p>
          Notre objectif est de bâtir une Marketplace fiable et transparente.
        </p>
      </div>
    ),
  },
  {
    title: "Comment devenir vendeur sur FullMargin ?",
    icon: Wallet,
    content: (
      <div className="space-y-3">
        <p>Pour devenir vendeur, vous devez :</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Créer un compte vendeur dédié,</li>
          <li>Accepter notre Charte vendeur,</li>
          <li>Publier vos produits en respectant nos formats et critères,</li>
          <li>Relier vos moyens de paiement pour percevoir vos revenus.</li>
        </ol>
        <p>
          Une commission raisonnable est prélevée par FullMargin afin de couvrir
          les frais techniques et d’assurer la fluidité des transactions.
        </p>
      </div>
    ),
  },
  {
    title: "Quels moyens de paiement acceptez-vous ?",
    icon: CreditCard,
    content: (
      <div className="space-y-3">
        <p>Nous travaillons principalement avec :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>les paiements bancaires classiques (cartes bancaires),</li>
          <li>les paiements en cryptomonnaies (BTC, ETH, USDT, etc.).</li>
        </ul>
        <p>
          À terme, nous envisageons également d’intégrer des moyens de paiement
          mobile (notamment pour l’Afrique) afin de faciliter l’accessibilité à
          un plus grand nombre d’utilisateurs.
        </p>
      </div>
    ),
  },
  {
    title: "Puis-je demander un remboursement ?",
    icon: Undo2,
    content: (
      <div className="space-y-3">
        <p>
          Les abonnements ne sont pas remboursables une fois la période
          commencée, sauf en cas d’erreur technique ou fraude avérée.
        </p>
        <p>
          Les produits numériques (robots, indicateurs, e-books) ne sont pas
          remboursables, sauf s’ils sont gravement défectueux ou non conformes à
          leur description.
        </p>
        <p>
          Pour les formations dans les communautés, la politique de
          remboursement est définie par le formateur, mais FullMargin peut
          intervenir comme médiateur si nécessaire.
        </p>
      </div>
    ),
  },
  {
    title: "Qu’est-ce que Fullmetrix (IA) ?",
    icon: Bot,
    content: (
      <div className="space-y-3">
        <p>
          Fullmetrix est l’intelligence artificielle spécialisée de FullMargin.
          Elle vous aide à :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>analyser vos stratégies et obtenir des suggestions,</li>
          <li>générer des analyses automatiques de marché,</li>
          <li>
            interagir avec vos comptes de trading connectés (via un agent IA),
          </li>
          <li>poser toutes vos questions via un chat intégré.</li>
        </ul>
        <p>
          C’est un véritable assistant IA de trading, évolutif et pensé pour
          accompagner votre progression.
        </p>
      </div>
    ),
  },
  {
    title: "FullMargin est-il sécurisé ?",
    icon: Lock,
    content: (
      <div className="space-y-3">
        <p>
          Oui. La sécurité est une priorité absolue pour nous. Nos transactions
          passent par des prestataires de paiement reconnus et sécurisés. Nos
          licences automatiques garantissent la protection des robots et
          indicateurs. Vos données personnelles sont protégées conformément au
          RGPD.
        </p>
      </div>
    ),
  },
  {
    title: "Puis-je utiliser FullMargin sans expérience en trading ?",
    icon: UserRound,
    content: (
      <div className="space-y-3">
        <p>
          Oui. FullMargin est conçu autant pour les débutants (qui veulent
          apprendre et s’organiser), que pour les traders expérimentés (qui
          veulent des outils professionnels).
        </p>
      </div>
    ),
  },
  {
    title: "Comment fonctionne la Communauté FullMargin ?",
    icon: Users,
    content: (
      <div className="space-y-3">
        <p>
          L’espace Communauté vous permet de rejoindre des communautés mais
          aussi de :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>créer votre propre communauté,</li>
          <li>animer vos membres avec des contenus exclusifs,</li>
          <li>organiser des lives et événements,</li>
          <li>vendre vos formations directement dans votre communauté,</li>
          <li>monétiser votre audience de façon sécurisée.</li>
        </ul>
        <p>Chaque communauté peut être gratuite ou payante, selon vos choix.</p>
      </div>
    ),
  },
  {
    title: "Existe-t-il un système d’affiliation ?",
    icon: Share2,
    content: (
      <div className="space-y-3">
        <p>
          Oui. Vous pouvez recommander FullMargin à d’autres utilisateurs et
          bénéficier d’un système d’affiliation rémunéré. C’est notre façon de
          remercier nos utilisateurs qui contribuent à la croissance de la
          plateforme.
        </p>
      </div>
    ),
  },
  {
    title: "Travaillez-vous avec des brokers ?",
    icon: Network,
    content: (
      <div className="space-y-3">
        <p>
          FullMargin n’est pas un broker et ne recommande aucun broker officiel.
          Cependant, nous envisageons de proposer à l’avenir une rubrique
          d’analyse informative où certains brokers ou plateformes de trading
          seront présentés de façon neutre, afin d’orienter les traders.
        </p>
        <p>
          Ces présentations seront purement éducatives, FullMargin n’assumant
          aucune responsabilité dans leur utilisation.
        </p>
      </div>
    ),
  },
  {
    title: "Comment contacter le support ?",
    icon: LifeBuoy,
    content: (
      <div className="space-y-3">
        <p>Vous pouvez nous contacter via :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>le chat intégré à la plateforme,</li>
          <li>le système de tickets support,</li>
          <li>
            ou par e-mail :{" "}
            <a className="underline" href="mailto:support@fullmargin.net">
              support@fullmargin.net
            </a>{" "}
            ou{" "}
            <a className="underline" href="mailto:support@fullmargin.net">
              support@fullmargin.net
            </a>
            .
          </li>
        </ul>
        <p>Notre équipe s’engage à répondre dans les 24 à 48 heures ouvrées.</p>
      </div>
    ),
  },
  {
    title:
      "Où puis-je trouver les informations légales et nos réseaux sociaux ?",
    icon: FileText,
    content: (
      <div className="space-y-3">
        <p>
          Toutes les informations officielles liées à nos mentions légales,
          politiques d’utilisation, politique de confidentialité, conditions
          générales de vente et de remboursement sont accessibles en bas de
          chaque page de notre site, dans le pied de page (footer).
        </p>
        <p>
          Vous y retrouverez également les liens vers nos différents réseaux
          sociaux officiels, afin de suivre nos actualités, nos mises à jour et
          nos contenus exclusifs.
        </p>
      </div>
    ),
  },
];

function FaqDisclosure({
  i,
  item,
}: {
  i: number;
  item: FaqItem;
}): React.ReactElement {
  const Id = useMemo(() => slug(item.title), [item.title]);
  const Icon = item.icon;

  return (
    <details
      id={Id}
      className="group rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface/70 backdrop-blur-sm open:bg-skin-surface shadow-sm open:shadow-md transition-colors"
    >
      <summary className="list-none cursor-pointer">
        <div className="flex gap-4 items-start sm:items-center p-5 sm:p-6">
          {/* bloc numéro + icône */}
          <div className="flex gap-2 sm:gap-3 items-center shrink-0">
            <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-fm-primary/10 text-fm-primary ring-1 ring-fm-primary/20">
              <span className="text-sm font-extrabold tabular-nums">{i}</span>
            </div>
            <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-fm-primary/8 text-fm-primary ring-1 ring-fm-primary/15">
              <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* titre */}
          <h3 className="text-base sm:text-lg font-extrabold text-skin-base flex-1 min-w-0">
            {item.title}
          </h3>

          {/* chevron */}
          <span className="ml-auto inline-flex items-center justify-center rounded-full ring-1 ring-skin-border/30 w-8 h-8 text-sm transition group-open:rotate-90 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </summary>

      <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-2 text-skin-muted text-[15px] leading-relaxed space-y-3">
        {item.content}
      </div>
    </details>
  );
}

export default function FAQ(): React.ReactElement {
  return (
    <main className="overflow-x-hidden">
      {/* HERO */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
          <div className="max-w-[900px] mx-auto text-center">
            <span className="inline-flex items-center justify-center mx-auto text-[11px] md:text-xs font-semibold px-2 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-surface/70">
              FAQ
            </span>
            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-[1.08] text-skin-base">
              Questions fréquentes
            </h1>
            <p className="mt-4 mx-auto max-w-[70ch] text-skin-muted text-base sm:text-lg leading-relaxed">
              Retrouvez ici toutes les réponses essentielles sur FullMargin :
              produit, sécurité, marketplace, support… tout est centralisé,
              clair et accessible.
            </p>
          </div>
        </div>
      </section>

      {/* Liste FAQ */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
          <div className="grid gap-4 sm:gap-5">
            {FAQ_ITEMS.map((it, idx) => (
              <FaqDisclosure key={it.title} i={idx + 1} item={it} />
            ))}
          </div>

          <div className="mt-10 sm:mt-12 mx-auto max-w-[900px] rounded-2xl ring-1 ring-skin-border/20 bg-skin-inset/60 p-6 text-center">
            <p className="text-skin-base font-semibold">
              Vous n’avez pas trouvé votre réponse ?
            </p>
            <p className="text-skin-muted">
              Ouvrez le chat support depuis la plateforme ou écrivez-nous à{" "}
              <a className="underline" href="mailto:support@fullmargin.net">
                support@fullmargin.net
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <style>{`
        summary::-webkit-details-marker { display: none; }
      `}</style>
    </main>
  );
}
