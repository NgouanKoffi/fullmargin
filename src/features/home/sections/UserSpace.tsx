// src/components/Home/UserSpace.tsx
import { motion } from "framer-motion";
import userSpaceGif from "@assets/gif/GIFFULLMARGING-ezgif.com-video-to-gif-converter.gif";

type Props = {
  ctaHref?: string;
};

export default function UserSpace({ ctaHref = "/finance#accounts" }: Props) {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-12 sm:py-14 lg:py-16">
        {/* HEADER CENTRÉ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-flex items-center text-[11px] md:text-xs font-semibold px-4 py-1.5 rounded-full bg-white/5 dark:bg-[#0A0C18] border border-white/10 shadow-[0_4px_24px_rgba(111,60,255,0.15)] text-fm-primary mx-auto mb-4 tracking-wide">
            Espace utilisateur
          </span>
          <h2 className="text-skin-base text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Espace utilisateur
          </h2>
        </motion.div>

        {/* CONTENU - NOUVELLE DISPOSITION */}
        <div className="relative mt-8 sm:mt-12 flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-20 items-center">

          {/* TEXTE (LEFT) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              visible: {
                transition: { staggerChildren: 0.15 },
              },
            }}
            className="w-full lg:w-[45%] xl:w-[40%] flex flex-col space-y-8 sm:space-y-10 lg:order-1"
          >
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-5">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-skin-base leading-[1.15]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">FullMargin</span> va encore plus loin.
              </h3>
              <p className="text-lg sm:text-xl font-medium text-skin-base/80 leading-relaxed">
                Les études montrent que les traders qui maîtrisent leur gestion financière et assurent un suivi régulier <span className="text-skin-base font-bold dark:text-white">réussissent bien au-delà de la moyenne.</span>
              </p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="relative bg-white/5 dark:bg-[#0A0C18]/80 border border-skin-border/20 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-fm-primary to-transparent rounded-l-2xl"></div>
              <p className="text-skin-muted text-base sm:text-lg leading-relaxed pl-2">
                Dans votre espace personnel, apprenez à mieux gérer vos finances,
                à analyser votre progression et à développer votre performance
                grâce à des <span className="font-semibold text-skin-base dark:text-gray-200">statistiques avancées</span>, spécialement conçues
                pour vous aider à identifier avec précision les points à améliorer.
              </p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <a
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-fm-primary text-white hover:shadow-[0_8px_20px_rgba(111,60,255,0.4)] px-8 py-4 text-base font-bold transition-all duration-300 hover:-translate-y-1"
              >
                Découvrir l’écosystème
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
            </motion.div>
          </motion.div>

          {/* GIF (RIGHT) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-[55%] xl:w-[60%] relative lg:order-2 group perspective-[1000px]"
          >
            {/* Ambient edge glow */}
            <div className="absolute inset-x-10 -bottom-10 h-1/2 bg-gradient-to-t from-fm-primary/30 to-transparent blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div
              className="
                relative z-10
                rounded-[24px] sm:rounded-[32px] lg:rounded-[40px]
                overflow-hidden
                bg-white/5 dark:bg-[#0A0C18]
                border border-skin-border/20 dark:border-white/10
                shadow-[0_24px_60px_rgba(0,0,0,0.15)]
              "
            >
              <img
                src={userSpaceGif}
                alt="Profil utilisateur FullMargin"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
