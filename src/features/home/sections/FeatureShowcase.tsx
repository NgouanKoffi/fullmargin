// src/components/Home/FeatureShowcase.tsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@core/auth/AuthContext";

import plateformeImg from "@assets/4 Plateforme.webp";
import communauteImg from "@assets/5 Communauté.webp";
import fullmetrixImg from "@assets/6 Fullmetrix.webp";

const cards = [
  {
    key: "personal",
    title: "Ton espace personnel",
    image: plateformeImg,
    bullets: [
      "Journal de trading, gestion des finances",
      "Outils de prise de notes, gestion de tâches & planification",
      "Podcasts immersifs et playlists gratuites",
    ],
  },
  {
    key: "communities",
    title: "Des communautés vérifiées",
    image: communauteImg,
    bullets: [
      "Rejoignez les meilleures communautés de traders",
      "Créez et gérez votre propre communauté",
      "Connectez-vous avec des passionnés du monde entier",
    ],
  },
  {
    key: "metrix",
    title: "Découvre FULL METRIX",
    image: fullmetrixImg,
    bullets: [
      "L'espace pro spécialement conçu pour ceux qui veulent passer au niveau supérieur",
      "Outils graphiques avancés de backtesting stratégique",
      "L’AGENT IA qui t'assiste en direct sur ton compte",
      "Outils replay d'indice synthétique et Copy trading",
    ],
  },
];

export default function FeatureShowcase() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const isGuest = status !== "authenticated";

  const handlePersonalClick = () => {
    if (isGuest) {
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
      );
      return;
    }
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

    "inline-flex items-center gap-2 rounded-xl bg-fm-primary text-white border border-transparent hover:shadow-[0_8px_20px_rgba(111,60,255,0.4)] px-5 py-2.5 text-sm font-bold transition-all duration-300 self-start group/btn hover:-translate-y-0.5";

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
              className={`
                group relative rounded-[28px] 
                ${card.key === "metrix"
                  ? "bg-gradient-to-br from-fm-primary/5 via-white to-fm-accent/5 dark:from-fm-primary/10 dark:via-[#0A0C18] dark:to-fm-accent/5 border-fm-primary/30 shadow-[0_4px_20px_rgba(111,60,255,0.1)] dark:shadow-[0_0_40px_rgba(111,60,255,0.15)] ring-1 ring-fm-primary/20"
                  : "bg-white/5 dark:bg-[#0A0C18] border-skin-border/20 dark:border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.12)] border"
                }
                backdrop-blur-none lg:backdrop-blur-md
                overflow-hidden flex flex-col h-full
                hover:-translate-y-2 transition-transform duration-500
              `}
            >
              {/* Subtle top glow */}
              <div
                className={`absolute top-0 inset-x-0 h-[1px] transition-colors duration-500 ${card.key === "metrix"
                  ? "bg-gradient-to-r from-transparent via-fm-primary to-transparent"
                  : "bg-gradient-to-r from-transparent via-fm-primary/40 to-transparent group-hover:via-fm-primary"
                  }`}
              />

              {/* image */}
              <div className="w-full px-5 pt-5 relative z-10">
                {card.key === "metrix" && (
                  <div className="absolute top-8 right-8 z-20 pointer-events-none">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-fm-primary/20 text-fm-primary border border-fm-primary/30 shadow-[0_0_15px_rgba(111,60,255,0.3)] backdrop-blur-md animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-fm-primary"></span>
                      IA INTÉGRÉE
                    </span>
                  </div>
                )}
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
              <div className="px-5 sm:px-6 pt-6 pb-6 flex flex-col flex-1 gap-4 relative z-10">
                <h3
                  className="text-xl sm:text-[22px] font-extrabold text-fm-primary dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-[#E879F9] dark:to-[#A855F7]"
                >
                  {card.title}
                </h3>

                <ul
                  className={`space-y-2 text-[15px] sm:text-base leading-relaxed ${card.key === "metrix"
                    ? "text-slate-700 dark:text-slate-200/90 font-medium"
                    : "text-skin-muted dark:text-slate-200/80"
                    }`}
                >
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fm-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 mt-auto">
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
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>

              {/* Glow derrière le contenu (abstrait) */}
              <div
                className={`absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-[40px] lg:blur-[60px] pointer-events-none transition-colors duration-700 ${card.key === "metrix"
                  ? "bg-fm-primary/30 group-hover:bg-fm-primary/40"
                  : "bg-fm-primary/10 group-hover:bg-fm-primary/20"
                  }`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
