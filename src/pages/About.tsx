// src/pages/About.tsx
import { useEffect } from "react";
import {
  ArrowRight,
  HeartHandshake,
  Target,
  Layers3,
  Cpu,
  Users,
  ShieldCheck,
  LineChart,
  BookOpen,
  Store,
  Network,
  CheckCircle2,
  Sparkles,
  Globe2,
} from "lucide-react";
import { IfAuth, IfGuest } from "../auth/AuthContext";

function openSupport(e?: React.MouseEvent | React.KeyboardEvent) {
  e?.preventDefault?.();
  window.dispatchEvent(new CustomEvent("fm:open-support"));
}

function openAccount(e?: React.MouseEvent | React.KeyboardEvent) {
  e?.preventDefault?.();
  window.dispatchEvent(new CustomEvent("fm:open-account"));
}

/* petit wrapper pour UNIFIER la taille des icônes */
function IconCircle({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "emerald";
}) {
  const colorCls =
    tone === "primary"
      ? "bg-fm-primary/10 text-fm-primary ring-fm-primary/15"
      : "bg-emerald-50/70 text-emerald-500 ring-emerald-400/25 dark:bg-emerald-500/5";
  return (
    <div
      className={`flex w-9 h-9 items-center justify-center rounded-full ring-1 ${colorCls} shrink-0`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-fm-primary/15 text-fm-primary ring-1 ring-fm-primary/25">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-skin-base">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-skin-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function About() {
  // Délégation : tout lien/bouton avec data-open-support, href="#contact" ou contenant "contact"
  useEffect(() => {
    const root = document.getElementById("about-root");
    if (!root) return;
    const onClick = (ev: MouseEvent) => {
      const el = ev.target as HTMLElement;
      const trigger =
        el.closest("[data-open-support]") ||
        el.closest('a[href="#contact"]') ||
        el.closest('a[href*="contact"]');
      if (trigger) {
        ev.preventDefault();
        openSupport();
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  return (
    <main id="about-root" className="overflow-x-hidden">
      {/* HERO (centré) */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
          <div className="max-w-[900px] mx-auto text-center">
            <span className="inline-flex items-center justify-center mx-auto text-[11px] md:text-xs font-semibold px-2 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-surface/70">
              À propos
            </span>

            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-[1.08] text-skin-base">
              Full Margin — l’écosystème du trader moderne
            </h1>

            <p className="mt-4 mx-auto max-w-[70ch] text-skin-muted text-base sm:text-lg leading-relaxed">
              Une page structurée, lisible et élégante : chaque bloc a sa propre
              ligne, avec un en-tête iconique et des contenus clairs.
            </p>
          </div>
        </div>
      </section>

      {/* === BLOC 1 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader
              icon={HeartHandshake}
              title="Une vision née d’une passion"
            />
            <div className="mt-4 space-y-4 text-skin-base leading-relaxed">
              <p>
                Pour nous, il ne s’agit pas simplement de développer une
                plateforme de plus dans l’univers du trading.{" "}
                <strong>FullMargin est né d’une passion.</strong> Une passion
                que partagent des milliers de traders à travers le monde.
              </p>
              <p>Mais le malheureux constat est que plusieurs :</p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <IconCircle tone="emerald">
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>se lancent sans accompagnement solide,</span>
                </li>
                <li className="flex gap-3">
                  <IconCircle tone="emerald">
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>jonglent entre des dizaines d’outils éparpillés,</span>
                </li>
                <li className="flex gap-3">
                  <IconCircle tone="emerald">
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>
                    cherchent des repères sur des forums ou des groupes où la
                    désinformation et les arnaques prospèrent,
                  </span>
                </li>
                <li className="flex gap-3">
                  <IconCircle tone="emerald">
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>
                    se perdent entre Telegram, réseaux sociaux et canaux non
                    régulés.
                  </span>
                </li>
              </ul>
              <p>
                Dans ce chaos, beaucoup abandonnent. Non pas par manque de
                volonté ou de talent, mais parce qu’il leur manque un véritable
                environnement d’apprentissage, de discipline et de sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 2 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader icon={Target} title="La naissance de FullMargin" />
            <div className="mt-4 space-y-4 text-skin-base leading-relaxed">
              <p>
                C’est de cette optique qu’est née FullMargin. Notre objectif ?
                Créer un écosystème complet et fiable, un espace où les traders,
                investisseurs et les web entrepreneurs se sentent enfin chez
                eux.
              </p>
              <p>
                <strong>FullMargin n’est pas une simple plateforme</strong> :
                c’est une révolution numérique, pensée pour centraliser tout ce
                dont un trader a besoin pour progresser, se discipliner et
                réussir.
              </p>
              <p>
                Nous avons investi dans la technologie, dans l’intelligence
                artificielle, dans la conception d’outils interconnectés pour
                une seule raison :
                <br />
                <strong>
                  👉 aider sincèrement la communauté des traders à se
                  structurer, à suivre leurs données, à grandir sans se perdre.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 3 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader
              icon={Layers3}
              title="Un écosystème interconnecté"
              subtitle="Tout se parle et tout est lié."
            />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  Icon: BookOpen,
                  text: "Des outils d’organisation : prise de notes, gestion de tâches, gestion financière…",
                },
                {
                  Icon: LineChart,
                  text: "Un journal de trading intelligent, qui aide à analyser et suivre ses performances.",
                },
                {
                  Icon: Cpu,
                  text: "Des graphiques et modules d’analyse intégrés, conçus pour backtester et affiner ses stratégies.",
                },
                {
                  Icon: Sparkles,
                  text: "Fullmetrix, notre IA dédiée, capable d’analyser, conseiller et même interagir avec les comptes de trading connectés.",
                },
                {
                  Icon: Users,
                  text: "Un espace Communauté : créez et gérez votre communauté, partagez, organisez des lives et vendez vos formations.",
                },
                {
                  Icon: Store,
                  text: "Une Marketplace sécurisée pour indicateurs, robots, e-books et ressources utiles.",
                },
              ].map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex gap-3 rounded-xl ring-1 ring-skin-border/20 bg-skin-inset px-4 py-3"
                >
                  <IconCircle>
                    <Icon className="w-4 h-4" />
                  </IconCircle>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-skin-base leading-relaxed">
              Chaque compartiment est pensé pour fonctionner ensemble, dans une
              logique d’écosystème fluide et cohérent.
            </p>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 4 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader
              icon={ShieldCheck}
              title="Une mission qui dépasse la technologie"
            />
            <p className="mt-4 text-skin-base leading-relaxed">
              Chez FullMargin, nous ne construisons pas uniquement des outils.
              Nous construisons un environnement durable, un refuge numérique où
              :
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex gap-3 rounded-xl ring-1 ring-skin-border/20 bg-skin-inset px-4 py-3">
                <IconCircle tone="emerald">
                  <ShieldCheck className="w-4 h-4" />
                </IconCircle>
                <span>la discipline remplace la confusion,</span>
              </div>
              <div className="flex gap-3 rounded-xl ring-1 ring-skin-border/20 bg-skin-inset px-4 py-3">
                <IconCircle tone="emerald">
                  <Network className="w-4 h-4" />
                </IconCircle>
                <span>la communauté remplace l’isolement,</span>
              </div>
              <div className="flex gap-3 rounded-xl ring-1 ring-skin-border/20 bg-skin-inset px-4 py-3">
                <IconCircle tone="emerald">
                  <Globe2 className="w-4 h-4" />
                </IconCircle>
                <span>la transparence remplace la fraude.</span>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-skin-base leading-relaxed">
              <p>
                Notre mission va au-delà du capitalisme pur : FullMargin a été
                conçu d’abord pour aider les traders à se protéger, progresser
                et réussir.
              </p>
              <p>
                Notre équipe s’agrandit et travaille chaque jour à développer
                les meilleurs outils avec une idée simple : apporter une vraie
                valeur à la communauté.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 5 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-fm-primary/70 rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader
              icon={Sparkles}
              title="L’avenir que nous construisons"
            />
            <div className="mt-4 space-y-4 text-skin-base leading-relaxed">
              <p>
                FullMargin, ce n’est pas seulement une plateforme d’aujourd’hui.
                C’est une vision sur le long terme :
              </p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <IconCircle>
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>développer des outils encore plus puissants,</span>
                </li>
                <li className="flex gap-3">
                  <IconCircle>
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>
                    enrichir l’intelligence artificielle pour anticiper les
                    besoins des traders,
                  </span>
                </li>
                <li className="flex gap-3">
                  <IconCircle>
                    <CheckCircle2 className="w-4 h-4" />
                  </IconCircle>
                  <span>
                    bâtir une communauté internationale solide et unie autour de
                    valeurs claires : discipline, partage, sécurité.
                  </span>
                </li>
              </ul>
              <p>
                Nous croyons qu’un trader n’a pas seulement besoin d’outils,
                mais d’un écosystème complet, où il peut trouver{" "}
                <strong>
                  👉 des repères, des ressources fiables et une communauté qui
                  l’accompagne.
                </strong>
              </p>
              <p>
                C’est cela, la promesse de FullMargin : réinventer l’expérience,
                pour que personne ne soit jamais laissé seul face au marché.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 6 — CTA ================================================== */}
      <section className="w-full pb-20">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl ring-1 ring-skin-border/20 bg-skin-surface p-6 sm:p-8">
            <SectionHeader icon={HeartHandshake} title="Rejoignez-nous" />
            <p className="mt-4 text-skin-base leading-relaxed">
              Full Margin, c’est déjà une communauté en mouvement — et avec toi,
              elle progressera.{" "}
              <strong>
                👉 Inscrivez-vous dès maintenant pour transformer votre trading
                en un véritable parcours structuré, sûr et collaboratif.
              </strong>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Invité : seul bouton AuthModal */}
              <IfGuest>
                <button
                  type="button"
                  onClick={openAccount}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold
                         bg-fm-primary text-skin-primary-foreground hover:opacity-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
                >
                  Se connecter ou créer un compte
                  <ArrowRight className="w-4 h-4" />
                </button>
              </IfGuest>

              {/* Connecté : seulement "Nous écrire" */}
              <IfAuth>
                <button
                  type="button"
                  data-open-support
                  onClick={openSupport}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold
                         bg-fm-primary text-skin-primary-foreground hover:opacity-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
                >
                  Nous écrire
                  <ArrowRight className="w-4 h-4" />
                </button>
              </IfAuth>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
