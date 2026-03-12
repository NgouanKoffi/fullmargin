// src/components/Home/SocialProof.tsx
import { motion, } from "framer-motion";

// ✅ Images (inversion des deux blocs)
import disperseLight from "@assets/gif/6-white.webp";
import disperseDark from "@assets/gif/6-black.webp";
import solutionLight from "@assets/gif/4-white.webp";
import solutionDark from "@assets/gif/5-black.webp";

export default function SocialProof() {
  return (
    <section className="w-full mt-10 sm:mt-14 lg:mt-20">
      <div className="mx-auto max-w-[1300px] px-3 sm:px-6 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
        {/* ===== TEXTE DU HAUT ===== */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="
            mb-10 sm:mb-12 lg:mb-14
            text-center
            text-2xl sm:text-3xl lg:text-[2rem]
            font-semibold
            leading-snug sm:leading-normal
            text-skin-base
            max-w-5xl mx-auto
          "
        >
          <span className="font-extrabold">Full Margin</span>, c’est ton
          écosystème de trading centralisé, conçu pour t’aider à devenir{" "}
          <span className="font-extrabold text-fm-primary">organisé</span>,{" "}
          <span className="font-extrabold text-fm-primary">performant</span> et{" "}
          <span className="font-extrabold text-fm-primary">connecté</span>.
        </motion.p>

        {/* ===== LES DEUX BLOCS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {/* BLOC GAUCHE */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="
              relative rounded-[24px] overflow-hidden
              bg-white/5 dark:bg-[#0A0C18]
              border border-white/10 dark:border-white/5
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]
              backdrop-blur-none sm:backdrop-blur-md
              flex flex-col group
            "
          >
            {/* Subtle top glow */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent group-hover:via-red-500 transition-colors duration-500" />

            <div className="pt-8 px-8 flex-1">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-skin-base mb-3 tracking-tight">
                Le fardeau de la dispersion
              </h2>
              <p className="text-base sm:text-lg text-skin-muted leading-relaxed">
                Jongler entre des dizaines de{" "}
                <span className="font-semibold text-skin-base">plateformes</span> fragmentées
                diminue votre concentration et votre rentabilité globale.
              </p>
            </div>

            {/* IMAGE EN GRAND */}
            <div className="px-6 pb-6 mt-8 flex justify-center">
              {/* Light */}
              <img
                src={disperseLight}
                alt="Outils dispersés"
                className="block dark:hidden w-[90%] h-auto max-h-[360px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
                draggable={false}
              />
              {/* Dark */}
              <img
                src={disperseDark}
                alt="Outils dispersés"
                className="hidden dark:block w-[90%] h-auto max-h-[360px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>

          {/* BLOC DROITE */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="
              relative rounded-[24px] overflow-hidden
              bg-white/5 dark:bg-[#0A0C18]
              border border-white/10 dark:border-white/5
              shadow-[0_8px_32px_rgba(111,60,255,0.08)]
              backdrop-blur-none sm:backdrop-blur-md
              flex flex-col group
            "
          >
            {/* Subtle top glow */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-fm-primary/50 to-transparent group-hover:via-fm-primary transition-colors duration-500" />

            {/* Background glow orb */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-fm-primary/10 rounded-full blur-[80px] group-hover:bg-fm-primary/20 transition-colors duration-700" />

            <div className="pt-8 px-8 flex-1 relative z-10">
              <div className="w-10 h-10 rounded-full bg-fm-primary/10 flex items-center justify-center mb-6 border border-fm-primary/20">
                <svg className="w-5 h-5 text-fm-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-skin-base mb-3 tracking-tight">
                L'écosystème unifié
              </h2>
              <p className="text-base sm:text-lg text-skin-muted leading-relaxed">
                Centralisez vos outils dans un environnement élégant et <span className="font-semibold text-skin-base">optimisé</span> pour propulser votre{" "}
                <span className="font-semibold text-skin-base">rentabilité</span>.
              </p>
            </div>

            {/* IMAGE EN GRAND */}
            <div className="px-6 pb-6 mt-8 flex justify-center relative z-10">
              {/* Light */}
              <img
                src={solutionLight}
                alt="Dashboard unifié"
                className="block dark:hidden w-[90%] h-auto max-h-[360px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
                draggable={false}
              />
              {/* Dark */}
              <img
                src={solutionDark}
                alt="Dashboard unifié"
                className="hidden dark:block w-[90%] h-auto max-h-[360px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
