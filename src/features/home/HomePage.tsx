// src/pages/Home.tsx
import { useAuth } from "@core/auth/AuthContext";
import HeroChart from "./sections/HeroChart";
import TickerTape from "./sections/TickerTape";
import FullMetrix from "./sections/FullMetrix";
import SocialProof from "./sections/SocialProof";
import FeatureShowcase from "./sections/FeatureShowcase";
import Avantage from "./sections/Avantage";
import CommunityHub from "./sections/CommunityHub";
import MarketplaceShowcase from "./sections/MarketplaceShowcase";
import UserSpace from "./sections/UserSpace";
import IntroVideo from "./sections/IntroVideo";
import FinalCTA from "./sections/FinalCTA";

export default function Home() {
  const { status } = useAuth();
  const isGuest = status !== "authenticated";

  const handlePrimary = () => {
    if (isGuest) {
      // pas connecté → on ouvre le modal auth
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
      );
      return;
    }

    const w = typeof window !== "undefined" ? window.innerWidth : 0;

    if (w < 1170) {
      // 👉 petit écran → on ouvre le QuickLauncherSheet
      window.dispatchEvent(new Event("fm:open-launcher"));
    } else {
      // 👉 grand écran → on ouvre le menu section / dock
      window.dispatchEvent(new Event("fm:open-account-dock"));
    }
  };

  const handleDiscover = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGuest) {
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
      );
      return;
    }
    // Si connecté, scroller vers la section features
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="overflow-x-hidden">
      <section className="w-full fm-section relative overflow-hidden" id="hero">
        {/* Dynamic Backgrounds */}
        <div className="fm-bg absolute inset-0 pointer-events-none z-0">
          <div className="fm-orb fm-orb--a" />
          <div className="fm-orb fm-orb--b" />
        </div>

        <div
          className="
            relative z-10
            mx-auto
            max-w-[1400px]
            px-3 sm:px-6 lg:px-10
            pt-4 sm:pt-8 lg:pt-10
            pb-10 sm:pb-12 lg:pb-16
          "
        >
          <div
            className="
                grid grid-cols-1
                lg:grid-cols-[0.9fr_1.1fr]
                items-center
                gap-10 md:gap-12 lg:gap-16
                will-change-transform
              "
            style={{ transform: "translateZ(0)" }}
          >
            {/* Colonne gauche (texte) */}
            <div className="min-w-0 lg:order-none">
              <div
                className="
                  flex flex-col gap-8 md:grid md:grid-cols-[1fr_auto] md:gap-8 lg:flex lg:flex-col lg:gap-0
                "
              >
                <div className="space-y-4 sm:space-y-5 md:space-y-6">

                  <h1
                    data-cue="slide-up"
                    data-delay="80"
                    className="
                      text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem]
                      leading-[1.12] sm:leading-[1.08] lg:leading-[1.05]
                      font-extrabold tracking-[-0.02em] max-w-[95%]
                    "
                  >
                    <span className="text-skin-base">Full Margin</span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E879F9] to-[#A855F7] bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite] drop-shadow-sm font-black">
                      L’écosystème du
                      <br /> trader moderne
                    </span>
                  </h1>

                  <p
                    data-cue="fade"
                    data-delay="160"
                    className="
                      text-base sm:text-lg leading-relaxed text-skin-muted
                      max-w-[90%] sm:max-w-[48ch] lg:max-w-[42ch]
                    "
                  >
                    Le premier écosystème tout-en-un des traders, entrepreneurs
                    et investisseurs. Un seul endroit. Tous vos outils. Pour
                    propulser votre réussite.
                  </p>
                </div>

                {/* Bouton principal */}
                <div
                  className="
                    mt-10 sm:mt-12 md:mt-14 md:justify-self-end lg:mt-14 lg:justify-self-auto
                  "
                  data-cue="fade"
                  data-delay="240"
                >
                  <div
                    className="
                      flex flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-2 lg:flex-row lg:items-center lg:gap-3
                    "
                  >
                    <button
                      type="button"
                      onClick={handlePrimary}
                      className="
                        relative group rounded-full px-7 py-3.5 text-sm font-bold
                        bg-fm-primary text-white
                        overflow-hidden transition-all duration-300
                        hover:scale-105 hover:shadow-[0_0_20px_rgba(111,60,255,0.4)]
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                        md:w-56 lg:w-auto text-center
                      "
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Commencer maintenant
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-fm-accent to-fm-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscover}
                      className="
                        group relative flex items-center justify-center gap-2
                        rounded-full px-7 py-3.5 text-sm font-semibold
                        bg-transparent text-skin-base border border-skin-border/50
                        hover:bg-skin-surface/80 hover:border-skin-border
                        transition-all duration-300 backdrop-blur-none sm:backdrop-blur-sm
                        text-center md:w-56 lg:w-auto
                      "
                    >
                      Découvrir
                      <svg className="w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Ticker */}
                <div
                  className="
                    mt-6 md:mt-7 md:col-span-2 lg:col-span-1
                    overflow-x-hidden
                  "
                  data-cue="fade"
                  data-delay="320"
                >
                  <TickerTape speed={38} />
                </div>
              </div>
            </div>

            {/* Colonne droite (visuel hero) */}
            <div
              className="
                order-last lg:order-none
                min-w-0 w-full lg:justify-self-end
                relative overflow-visible
              "
              data-cue="zoom"
              data-delay="120"
              style={{ transform: "translateZ(0)" }}
            >
              <div className="w-full relative overflow-visible">
                <HeroChart />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF (3D) ===== */}
      <section className="cv-auto fm-section">
        <IntroVideo />
      </section>

      {/* ===== SOCIAL PROOF (3D) ===== */}
      <section className="cv-auto fm-section">
        <SocialProof />
      </section>

      {/* ===== FEATURE SHOWCASE (3D) ===== */}
      <section className="cv-auto fm-section">
        <FeatureShowcase />
      </section>

      {/* ===== COPY TRADERS + USER SPACE ===== */}
      <section className="cv-auto fm-section">
        <Avantage ctaHref="#ctrader" />
        <UserSpace ctaHref="#mt5" />
      </section>

      {/* ===== FULL METRIX VIDEO (juste avant CommunityHub & MarketplaceShowcase) ===== */}
      <section className="cv-auto fm-section">
        <FullMetrix />
      </section>

      {/* ===== COMMUNITY ===== */}
      <section className="cv-auto fm-section">
        <CommunityHub />
      </section>

      {/* ===== MARKETPLACE ===== */}
      <section className="cv-auto fm-section">
        <MarketplaceShowcase />
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="cv-auto fm-section">
        <FinalCTA />
      </section>
    </main>
  );
}
