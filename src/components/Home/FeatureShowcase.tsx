// src/components/Home/FeatureShowcase.tsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import plateformeImg from "../../assets/4 Plateforme.webp";
import communauteImg from "../../assets/5 Communauté.webp";
import fullmetrixImg from "../../assets/6 Fullmetrix.webp";

const cards = [
  {
    key: "personal",
    title: "Ton espace personnel",
    image: plateformeImg,
    bullets: [
      "Journal de trading, gestion des finances..",
      "Outils de prise de notes, gestion de tâches & planification...",
      "Podcasts immersifs et playlists gratuites pour apprendre, méditer et progresser...",
    ],
  },
  {
    key: "communities",
    title: "Des communautés vérifiées",
    image: communauteImg,
    bullets: [
      "Rejoins les meilleurs communautés de traders...",
      "Créez et gérez votre propre communauté privée ou public...",
      "Prends contact avec des passionnés du monde entier.",
    ],
  },
  {
    key: "metrix",
    title: "Découvre FULL METRIX",
    image: fullmetrixImg,
    bullets: [
      "L’IA spécialement conçue pour t’assister dans ton évolution...",
      "Des outils graphiques avancés pour concevoir et backtester ta stratégie.",
      "L’AGENT IA qui te suis et t’assiste en direct sur ton compte.",
    ],
  },
];

export default function FeatureShowcase() {
  const navigate = useNavigate();

  const handlePersonalClick = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    if (w < 1170) {
      window.dispatchEvent(new Event("fm:open-launcher"));
    } else {
      window.dispatchEvent(new Event("fm:open-account-dock"));
    }
  };

  const handleCommunitiesClick = () => {
    navigate("/communaute");
  };

  // ✅ Toujours renvoyer vers la page de présentation FullMetrix
  const handleMetrixClick = () => {
    navigate("/fm-metrix/a-propos");
    // (Alternative si tu veux forcer hors SPA: window.location.href = "/fm-metrix/a-propos";)
  };

  const btnBase =
    "inline-flex items-center gap-2 rounded-[14px] bg-fm-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-95 transition";

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10 py-12 sm:py-14 lg:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center text-2xl sm:text-4xl font-extrabold tracking-tight text-skin-base"
        >
          Nos fonctionnalités clés
        </motion.h2>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.45,
                ease: "easeOut",
                delay: idx * 0.03,
              }}
              className="rounded-[28px] bg-skin-surface/80 dark:bg-skin-surface ring-1 ring-skin-border/15 shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full"
            >
              {/* image */}
              <div className="w-full px-4 pt-4">
                <div className="rounded-[20px] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-[150px] sm:h-[160px] object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* contenu */}
              <div className="px-4 sm:px-5 pt-5 pb-5 flex flex-col flex-1 gap-3">
                <h3 className="text-xl sm:text-[22px] font-extrabold text-skin-base dark:text-white">
                  {card.title}
                </h3>

                <ul className="space-y-2 text-[15px] sm:text-base leading-relaxed text-skin-muted dark:text-slate-200/80">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fm-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3">
                  {card.key === "personal" && (
                    <button
                      type="button"
                      onClick={handlePersonalClick}
                      className={btnBase}
                    >
                      En savoir plus
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {card.key === "communities" && (
                    <button
                      type="button"
                      onClick={handleCommunitiesClick}
                      className={btnBase}
                    >
                      En savoir plus
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {card.key === "metrix" && (
                    <button
                      type="button"
                      onClick={handleMetrixClick}
                      className={btnBase}
                    >
                      Découvrir FM Metrix
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
