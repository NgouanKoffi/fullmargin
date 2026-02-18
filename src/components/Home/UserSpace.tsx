// src/components/Home/UserSpace.tsx
import userSpaceGif from "../../assets/gif/GIFFULLMARGING-ezgif.com-video-to-gif-converter.gif";

type Props = {
  ctaHref?: string;
};

export default function UserSpace({ ctaHref = "#ecosysteme" }: Props) {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-12 sm:py-14 lg:py-16">
        {/* HEADER CENTRÉ */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center text-[11px] md:text-xs font-medium px-3 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-surface/60 mx-auto">
            Espace utilisateur
          </span>
          <h2 className="mt-4 text-skin-base text-4xl sm:text-5xl font-extrabold leading-tight">
            Espace utilisateur
          </h2>
        </div>

        {/* CONTENU */}
        <div
          className="
            grid grid-cols-1
            lg:grid-cols-[0.65fr_1.35fr]
            gap-10 lg:gap-14
            items-center
          "
        >
          {/* TEXTE */}
          <div
            className="
              space-y-5
              lg:order-1
              lg:max-w-[560px]
              lg:ml-auto
            "
          >
            <p className="text-skin-base/90 text-base lg:text-lg leading-relaxed">
              Les études montrent que les traders qui maîtrisent leur gestion
              financière et assurent un suivi régulier de leur journal de
              trading réussissent bien au-delà de la moyenne.
              <br />
              <span className="inline-block mt-2">
                Mais <span className="font-semibold">FullMargin</span> va encore
                plus loin.
              </span>
            </p>

            <p className="text-skin-base/80 text-base lg:text-lg leading-relaxed">
              Dans votre espace personnel, apprenez à mieux gérer vos finances,
              à analyser votre progression et à développer votre performance
              grâce à des données et statistiques avancées, spécialement conçues
              pour vous aider à identifier avec précision les points à améliorer
              et ceux à consolider tout au long de votre carrière de trader.
            </p>

            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-fm-primary text-white px-6 py-3 font-semibold shadow-sm hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/60"
            >
              Découvrir l’écosystème
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* GIF (remplace VIDEO) */}
          <div className="relative lg:order-2">
            <div
              className="absolute -inset-10 rounded-[48px] bg-fm-primary/12 dark:bg-fm-primary/8 blur-3xl pointer-events-none"
              aria-hidden
            />
            <div
              className="
                relative
                rounded-[48px]
                overflow-hidden
                bg-skin-surface
                ring-1 ring-skin-border/25
                shadow-[0_18px_45px_rgba(0,0,0,0.12)]
                w-full
              "
            >
              <img
                src={userSpaceGif}
                alt="Profil utilisateur FullMargin"
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
