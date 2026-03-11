// src/components/Home/Avantage.tsx
import avantageImage from "@assets/Image de présentation.webp";

type Props = {
  ctaHref?: string;
};

const pillIconCls =
  "w-4 h-4 fill-current stroke-current [stroke-width:1.5] drop-shadow-[0_1px_0_rgba(0,0,0,0.65)]";

const pillIcons = [
  // étoile
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="M12 2 9.8 8.2 4 9.1l4.4 4L7.5 19 12 15.9 16.5 19l-1-5.9L20 9.1l-5.8-.9L12 2Z" />
  </svg>,
  // bouclier
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="M12 2 5 5v6c0 4.3 2.8 8.1 7 9.5 4.2-1.4 7-5.2 7-9.5V5l-7-3Zm0 6.5 3 1v1.7c0 1.7-.9 3.4-2.3 4.5L12 16l-.7-.3C10 14.6 9 12.9 9 11.2V9.5l3-1Z" />
  </svg>,
  // panier / vente
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="M4 6h16v2H4V6Zm2 4h12l-1 8H7l-1-8Zm4-6h4v2h-4V4Z" />
  </svg>,
  // éclair / IA
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="m13 2-6 9h4v7l6-9h-4V2Z" />
  </svg>,
  // stylo / outil
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="m4 17.2 7.9-7.9 3.7 3.7-7.9 7.9H4v-3.7Zm10-10 2-2 3.7 3.7-2 2-3.7-3.7Z" />
  </svg>,
  // users
  <svg viewBox="0 0 24 24" className={pillIconCls} aria-hidden>
    <path d="M9 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 18c0-2 2-3.5 4-3.5h4c.6 0 1.3.1 1.9.4A4 4 0 0 0 17 14c2 0 4 1.5 4 4v1H3v-1Z" />
  </svg>,
];

export default function Avantage({ ctaHref = "#ecosysteme" }: Props) {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-12 sm:py-14 lg:py-16">
        {/* TITRE CENTRÉ */}
        <div className="mb-8 lg:mb-10 text-center">
          <h2 className="text-skin-base text-3xl sm:text-4xl font-semibold">
            Chez Full Margin, nous avons conçu une plateforme
          </h2>
          <p className="text-skin-base/80 text-sm sm:text-base mt-3 max-w-3xl mx-auto">
            qui va bien au-delà des simples outils. Voici pourquoi vous allez
            adorer l’utiliser :
          </p>
        </div>

        {/* 2 COLONNES — gauche un peu plus large */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-14 items-center">
          {/* IMAGE GAUCHE avec conteneur premium */}
          <div className="relative group perspective-[1000px]">
            {/* Glow abstrait */}
            <div className="absolute inset-0 bg-gradient-to-tr from-fm-primary/20 to-fm-accent/20 rounded-[48px] blur-[30px] lg:blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div
              className="
                relative z-10
                rounded-[32px] sm:rounded-[48px]
                overflow-hidden
                bg-white/5 dark:bg-[#0A0C18]
                border border-white/10 dark:border-white/5
                shadow-[0_24px_60px_rgba(0,0,0,0.15)]
              "
            >
              <img
                src={avantageImage}
                alt="Aperçu de l'écosystème Full Margin"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* LISTE À DROITE */}
          <div className="flex flex-col gap-3">
            {[
              "Très simple à utiliser",
              "100 % sécurisé et modéré",
              "Monétisez vos créations en toute simplicité",
              "Découvrez la puissance de Full-Metrix",
              "Des outils spécialement pensés pour vous",
              "Rejoignez ou bâtissez des communautés uniques",
            ].map((text, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-4
                  rounded-2xl
                  bg-white/5 dark:bg-white/5
                  border border-black/15 dark:border-white/20
                  hover:bg-white/10 dark:hover:bg-white/10
                  hover:border-fm-primary/50
                  transition-all duration-300
                  backdrop-blur-none sm:backdrop-blur-sm
                  px-4 sm:px-5 py-3
                  group
                "
              >
                {/* icône */}
                <span
                  className="
                    h-10 w-10 rounded-full
                    flex items-center justify-center
                    bg-fm-primary/10 text-fm-primary
                    group-hover:bg-fm-primary group-hover:text-white
                    transition-colors duration-300
                    shrink-0
                  "
                >
                  {pillIcons[i]}
                </span>

                <span className="text-sm sm:text-base font-medium text-skin-base dark:text-slate-200">
                  {text}
                </span>
              </div>
            ))}

            <a
              href={ctaHref}
              className="mt-3 inline-flex items-center gap-2 text-fm-primary font-semibold"
            >
              {/* Découvrir l’écosystème → */}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
