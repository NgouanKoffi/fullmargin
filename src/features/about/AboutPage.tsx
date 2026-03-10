// src/pages/About.tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
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
import { IfAuth, IfGuest } from "@core/auth/AuthContext";

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.8 } }
  };

  return (
    <main id="about-root" className="overflow-x-hidden">
      {/* HERO (Constellation / Espace Profond) */}
      <section className="w-full relative overflow-hidden min-h-[50vh] flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-[#06080A] dark:to-black transition-colors duration-500">
        {/* Subtle star-like dots via CSS background */}
        <div className="absolute inset-0 opacity-40 dark:opacity-50 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
          <div className="max-w-[1000px] mx-auto text-center">
            <span
              data-cue="fade"
              className="inline-flex items-center justify-center mx-auto text-[11px] md:text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ring-slate-200 dark:ring-white/10 bg-slate-100 dark:bg-white/5 backdrop-blur-md shadow-[0_4px_24px_rgba(111,60,255,0.15)] text-skin-muted"
            >
              À propos
            </span>

            <motion.h1
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-[-0.02em] leading-[1.08] text-skin-base"
            >
              <motion.span variants={item} className="inline-block mr-3">Full</motion.span>
              <motion.span variants={item} className="inline-block mb-3">Margin</motion.span>
              <br />
              <motion.span variants={item} className="inline-block relative mr-3">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-fm-primary to-[#A855F7] dark:from-[#A855F7] dark:to-[#D946EF] py-2 px-3 -my-2 -mx-3">
                  l’écosystème
                </span>
              </motion.span>
              <motion.span variants={item} className="inline-block relative mr-3">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#D946EF] dark:from-[#D946EF] dark:to-[#F472B6] py-2 px-3 -my-2 -mx-3">
                  du
                </span>
              </motion.span>
              <motion.span variants={item} className="inline-block relative mr-3">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-fm-primary to-[#A855F7] dark:from-[#A855F7] dark:to-[#D946EF] py-2 px-3 -my-2 -mx-3">
                  trader
                </span>
              </motion.span>
              <motion.span variants={item} className="inline-block relative">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#D946EF] dark:from-[#D946EF] dark:to-[#F472B6] py-2 px-3 -my-2 -mx-3">
                  moderne
                </span>
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-6 mx-auto max-w-[70ch] text-skin-muted text-lg sm:text-xl leading-relaxed"
            >
              Une plateforme structurée, lisible et élégante : chaque outil a sa
              place pour vous permettre de passer de débutant à expert, sans
              bruit ni friction.
            </motion.p>
          </div>
        </div>
      </section>

      {/* === BLOC 1 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div
            data-cue="slide-up"
            className="group relative rounded-[32px] bg-white dark:bg-[#06080A] border border-slate-200 dark:border-fm-primary/20 hover:border-fm-primary/50 dark:hover:border-fm-primary/50 p-8 sm:p-10 lg:p-12 overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(111,60,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(111,60,255,0.15)]"
          >
            {/* abstract glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-fm-primary/10 rounded-full blur-[80px] group-hover:bg-fm-primary/20 transition-colors duration-700 pointer-events-none" />

            <div className="relative z-10">
              <SectionHeader
                icon={HeartHandshake}
                title="Une vision née d’une passion"
              />
              <div className="mt-6 space-y-5 text-skin-muted dark:text-slate-200/90 text-base sm:text-lg leading-relaxed">
                <p>
                  Pour nous, il ne s’agit pas simplement de développer une
                  plateforme de plus dans l’univers du trading.{" "}
                  <strong className="text-skin-base dark:text-white font-bold">
                    FullMargin est né d’une passion.
                  </strong>{" "}
                  Une passion que partagent des milliers de traders à travers le
                  monde.
                </p>
                <p>Mais le malheureux constat est que plusieurs :</p>
                <ul className="space-y-3 mt-4">
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
                  <li className="flex gap-3 items-start">
                    <IconCircle tone="emerald">
                      <CheckCircle2 className="w-4 h-4 mt-0.5" />
                    </IconCircle>
                    <span>
                      se perdent entre Telegram, réseaux sociaux et canaux non
                      régulés.
                    </span>
                  </li>
                </ul>
                <p className="mt-6 pt-2">
                  Dans ce chaos, beaucoup abandonnent. Non pas par manque de
                  volonté ou de talent, mais parce qu’il leur manque un véritable
                  environnement d’apprentissage, de discipline et de sécurité.
                </p>
              </div>
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
          <div
            data-cue="slide-up"
            className="group relative rounded-[32px] bg-white dark:bg-[#06080A] border border-slate-200 dark:border-fm-primary/20 hover:border-fm-primary/50 dark:hover:border-fm-primary/50 p-8 sm:p-10 lg:p-12 overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(111,60,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(111,60,255,0.15)]"
          >
            {/* abstract glow */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fm-accent/10 rounded-full blur-[80px] group-hover:bg-fm-accent/20 transition-colors duration-700 pointer-events-none" />

            <div className="relative z-10">
              <SectionHeader icon={Target} title="La naissance de FullMargin" />
              <div className="mt-6 space-y-5 text-skin-muted dark:text-slate-200/90 text-base sm:text-lg leading-relaxed">
                <p>
                  C’est de cette optique qu’est née FullMargin. Notre objectif ?
                  Créer un écosystème complet et fiable, un espace où les traders,
                  investisseurs et les web entrepreneurs se sentent enfin chez
                  eux.
                </p>
                <p>
                  <strong className="text-skin-base dark:text-white font-bold">
                    FullMargin n’est pas une simple plateforme
                  </strong>{" "}
                  : c’est une révolution numérique, pensée pour centraliser tout
                  ce dont un trader a besoin pour progresser, se discipliner et
                  réussir.
                </p>
                <p>
                  Nous avons investi dans la technologie, dans l’intelligence
                  artificielle, dans la conception d’outils interconnectés pour
                  une seule raison :
                  <br />
                  <strong className="text-fm-primary font-semibold block mt-3 text-lg sm:text-xl">
                    Aider sincèrement la communauté des traders à se
                    structurer, à suivre leurs données, à grandir sans se perdre.
                  </strong>
                </p>
              </div>
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
          <div
            data-cue="slide-up"
            className="group relative rounded-[32px] bg-white dark:bg-[#06080A] border border-slate-200 dark:border-fm-primary/20 hover:border-fm-primary/50 dark:hover:border-fm-primary/50 p-8 sm:p-10 lg:p-12 overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(111,60,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(111,60,255,0.15)]"
          >
            {/* abstract glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fm-primary/5 rounded-full blur-[100px] group-hover:bg-fm-primary/10 transition-colors duration-700 pointer-events-none" />

            <div className="relative z-10">
              <SectionHeader
                icon={Layers3}
                title="Un écosystème interconnecté"
                subtitle="Tout se parle et tout est lié."
              />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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
                    className="flex gap-4 rounded-2xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 transition-colors duration-300 p-5 shadow-sm dark:shadow-none"
                  >
                    <IconCircle>
                      <Icon className="w-5 h-5" />
                    </IconCircle>
                    <span className="text-skin-base dark:text-slate-200/90 text-sm sm:text-base leading-relaxed">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-skin-muted dark:text-slate-400 text-center mx-auto max-w-2xl text-base sm:text-lg">
                Chaque compartiment est pensé pour fonctionner ensemble, dans
                une logique d’écosystème fluide et cohérent.
              </p>
            </div>
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
          <div
            data-cue="slide-up"
            className="group relative rounded-[32px] bg-white dark:bg-[#06080A] border border-slate-200 dark:border-fm-primary/20 hover:border-fm-primary/50 dark:hover:border-fm-primary/50 p-8 sm:p-10 lg:p-12 overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(111,60,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(111,60,255,0.15)]"
          >
            {/* abstract glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/15 transition-colors duration-700 pointer-events-none" />

            <div className="relative z-10">
              <SectionHeader
                icon={ShieldCheck}
                title="Une mission qui dépasse la technologie"
              />
              <p className="mt-6 text-skin-muted dark:text-slate-200/90 text-base sm:text-lg leading-relaxed">
                Chez FullMargin, nous ne construisons pas uniquement des outils.
                Nous construisons un environnement durable, un refuge numérique où
                :
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="flex flex-col gap-3 rounded-2xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02] p-5">
                  <IconCircle tone="emerald">
                    <ShieldCheck className="w-5 h-5" />
                  </IconCircle>
                  <span className="text-skin-base dark:text-slate-200/90 font-medium">la discipline remplace la confusion,</span>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02] p-5">
                  <IconCircle tone="emerald">
                    <Network className="w-5 h-5" />
                  </IconCircle>
                  <span className="text-skin-base dark:text-slate-200/90 font-medium">la communauté remplace l’isolement,</span>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02] p-5">
                  <IconCircle tone="emerald">
                    <Globe2 className="w-5 h-5" />
                  </IconCircle>
                  <span className="text-skin-base dark:text-slate-200/90 font-medium">la transparence remplace la fraude.</span>
                </div>
              </div>
              <div className="mt-8 space-y-4 text-skin-muted dark:text-slate-200/90 text-base sm:text-lg leading-relaxed">
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
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-8">
        <div className="h-px bg-skin-border/30" />
      </div>

      {/* === BLOC 5 ======================================================== */}
      <section className="w-full">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div
            data-cue="slide-up"
            className="group relative rounded-[32px] bg-white dark:bg-[#06080A] border border-slate-200 dark:border-fm-primary/20 hover:border-fm-primary/50 dark:hover:border-fm-primary/50 p-8 sm:p-10 lg:p-12 overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(111,60,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(111,60,255,0.15)]"
          >
            {/* abstract glow */}
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-fm-primary/10 rounded-full blur-[100px] group-hover:bg-fm-primary/15 transition-colors duration-700 pointer-events-none" />

            <div className="relative z-10">
              <SectionHeader
                icon={Sparkles}
                title="L’avenir que nous construisons"
              />
              <div className="mt-6 space-y-5 text-skin-muted dark:text-slate-200/90 text-base sm:text-lg leading-relaxed">
                <p>
                  FullMargin, ce n’est pas seulement une plateforme d’aujourd’hui.
                  C’est une vision sur le long terme :
                </p>
                <ul className="space-y-4 mt-4">
                  <li className="flex gap-4 items-start">
                    <IconCircle>
                      <CheckCircle2 className="w-5 h-5 mt-0.5" />
                    </IconCircle>
                    <span>développer des outils encore plus puissants,</span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <IconCircle>
                      <CheckCircle2 className="w-5 h-5 mt-0.5" />
                    </IconCircle>
                    <span>
                      enrichir l’intelligence artificielle pour anticiper les
                      besoins des traders,
                    </span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <IconCircle>
                      <CheckCircle2 className="w-5 h-5 mt-0.5" />
                    </IconCircle>
                    <span>
                      bâtir une communauté internationale solide et unie autour de
                      valeurs claires : discipline, partage, sécurité.
                    </span>
                  </li>
                </ul>
                <p className="mt-8 pt-4">
                  Nous croyons qu’un trader n’a pas seulement besoin d’outils,
                  mais d’un écosystème complet, où il peut trouver{" "}
                  <strong className="text-fm-primary font-semibold">
                    des repères, des ressources fiables et une communauté qui
                    l’accompagne.
                  </strong>
                </p>
                <p className="font-medium text-skin-base dark:text-white">
                  C’est cela, la promesse de FullMargin : réinventer l’expérience,
                  pour que personne ne soit jamais laissé seul face au marché.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* séparateur */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 my-10">
        <div className="h-px bg-skin-border/20 dark:bg-white/10" />
      </div>

      {/* === BLOC 6 — CTA ================================================== */}
      <section className="w-full pb-20">
        <div className="container mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div
            data-cue="slide-up"
            className="relative rounded-[32px] border border-slate-200 dark:border-fm-primary/30 bg-white dark:bg-[#06080A] overflow-hidden p-8 sm:p-12 text-center group shadow-xl dark:shadow-none transition-colors duration-500"
          >
            {/* Animated Constellation radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fm-primary/5 rounded-full blur-[100px] group-hover:bg-fm-primary/20 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
            <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-skin-base dark:text-white">
              Rejoignez-nous
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-skin-muted dark:text-slate-200/90 text-lg sm:text-xl leading-relaxed">
              Full Margin, c’est déjà une plateforme en mouvement — et avec vous,
              elle progressera.{" "}
              <strong className="block mt-2 text-fm-primary dark:text-white font-semibold">
                Inscrivez-vous dès maintenant pour transformer votre trading
                en un véritable parcours structuré, sûr et collaboratif.
              </strong>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Invité : seul bouton AuthModal */}
              <IfGuest>
                <button
                  type="button"
                  onClick={openAccount}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold
                         bg-fm-primary text-white shadow-[0_8px_24px_rgba(111,60,255,0.4)]
                         transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(111,60,255,0.6)]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
                >
                  Créer un compte
                  <ArrowRight className="w-5 h-5" />
                </button>
              </IfGuest>

              {/* Connecté : seulement "Nous écrire" */}
              <IfAuth>
                <button
                  type="button"
                  data-open-support
                  onClick={openSupport}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold
                          bg-fm-primary text-white shadow-[0_0_20px_rgba(111,60,255,0.5)]
                          transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(111,60,255,0.8)]
                          relative overflow-hidden
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
                >
                  Nous écrire
                  <ArrowRight className="w-5 h-5" />
                </button>
              </IfAuth>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
