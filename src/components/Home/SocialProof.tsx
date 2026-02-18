// src/components/Home/SocialProof.tsx
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// ✅ Images (inversion des deux blocs)
import disperseLight from "../../assets/gif/6-white.webp";
import disperseDark from "../../assets/gif/6-black.webp";
import solutionLight from "../../assets/gif/4-white.webp";
import solutionDark from "../../assets/gif/5-black.webp";

export default function SocialProof() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 80%", "end 20%"],
  });

  const lift = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const fade = useTransform(scrollYProgress, [0, 0.25, 1], [0, 1, 1]);

  return (
    <section ref={rootRef} className="w-full mt-10 sm:mt-14 lg:mt-20">
      <div className="mx-auto max-w-[1300px] px-3 sm:px-6 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
        {/* ===== TEXTE DU HAUT ===== */}
        <motion.p
          style={{ opacity: fade, y: lift }}
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
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative rounded-[18px] bg-white/70 dark:bg-[#070E3A] border border-skin-border/25 shadow-[0_8px_22px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            <div className="pt-5 px-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-skin-base mb-2">
                Trop dispersé !!
              </h2>
              <p className="text-sm sm:text-base text-skin-muted leading-relaxed mb-4">
                Nous sommes tous perdu entre toutes ces différentes{" "}
                <span className="font-semibold text-skin-base">
                  plateformes
                </span>{" "}
                !
              </p>
            </div>

            {/* IMAGE EN GRAND (sans bloc interne) */}
            <div className="px-4 sm:px-5 pb-5">
              {/* Light */}
              <img
                src={disperseLight}
                alt="Outils dispersés (light)"
                className="block dark:hidden w-full h-auto max-h-[320px] sm:max-h-[360px] lg:max-h-[420px] object-contain rounded-[16px] select-none"
                loading="lazy"
                draggable={false}
              />
              {/* Dark */}
              <img
                src={disperseDark}
                alt="Outils dispersés (dark)"
                className="hidden dark:block w-full h-auto max-h-[320px] sm:max-h-[360px] lg:max-h-[420px] object-contain rounded-[16px] select-none"
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
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.02 }}
            className="relative rounded-[18px] overflow-hidden bg-gradient-to-br from-[#1F6BFF] via-[#7053D9] to-[#E95FBD] dark:from-[#1F6BFF] dark:via-[#5C47BF] dark:to-[#BF4FA1] border border-white/10 shadow-[0_8px_22px_rgba(3,189,255,0.25)]"
          >
            <div className="pt-5 px-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2">
                Une seule solution
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-4 max-w-md">
                Ici tout est <span className="font-semibold">réuni</span>, très{" "}
                <span className="font-semibold">simple</span> et pensé
                spécialement pour votre{" "}
                <span className="font-semibold">rentabilité</span>.
              </p>
            </div>

            {/* IMAGE EN GRAND (sans bloc interne) */}
            <div className="px-4 sm:px-5 pb-5">
              {/* Light */}
              <img
                src={solutionLight}
                alt="Dashboard unifié (light)"
                className="block dark:hidden w-full h-auto max-h-[320px] sm:max-h-[360px] lg:max-h-[420px] object-contain rounded-[16px] select-none"
                loading="lazy"
                draggable={false}
              />
              {/* Dark */}
              <img
                src={solutionDark}
                alt="Dashboard unifié (dark)"
                className="hidden dark:block w-full h-auto max-h-[320px] sm:max-h-[360px] lg:max-h-[420px] object-contain rounded-[16px] select-none"
                loading="lazy"
                draggable={false}
              />
            </div>

            <div className="pointer-events-none absolute -right-10 -bottom-10 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
