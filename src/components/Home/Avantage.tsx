// src/components/Home/Avantage.tsx
import avantageImage from "../../assets/Image de présentation.webp";

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
          {/* IMAGE GAUCHE un peu plus grosse + contour */}
          <div>
            <div
              className="
                relative
                rounded-[48px]
                overflow-hidden
                bg-skin-surface
                ring-1 ring-skin-border/25
                shadow-[0_18px_45px_rgba(0,0,0,0.12)]
              "
            >
              <img
                src={avantageImage}
                alt="Aperçu de l'écosystème Full Margin"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* LISTE À DROITE */}
          <div className="flex flex-col gap-3">
            {[
              "Très simple à utiliser",
              "100 % sécurisé et modéré",
              "Vendez vos créations en toute simplicité",
              "Découvrez la puissance de l’IA Full-Metrix",
              "Des outils spécialement pensés pour vous",
              "Rejoignez ou bâtissez des communautés uniques",
            ].map((text, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-3
                  rounded-full
                  bg-skin-surface/40
                  ring-1 ring-skin-border/40
                  
                  /* MODIFICATIONS ICI : Ring plus épais, couleur violette et ombre brillante */
                  dark:bg-white/5 
                  dark:ring-[3px] 
                  dark:ring-violet-500 
                  dark:shadow-[0_0_15px_rgba(139,92,246,0.3)]
                  
                  px-4 sm:px-5 py-2.5
                "
              >
                {/* icône : jour = fond sombre + icône blanche / nuit = fond blanc + icône primaire */}
                <span
                  className="
                    h-10 w-10 rounded-full
                    grid place-items-center
                    bg-[#15192A] text-white
                    ring-1 ring-white/22
                    shadow-sm
                    dark:bg-white dark:text-fm-primary dark:ring-black/10
                    shrink-0
                  "
                >
                  {pillIcons[i]}
                </span>

                <span className="text-sm sm:text-base text-skin-base dark:text-white leading-snug">
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
