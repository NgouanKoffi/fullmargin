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


  return (
    <main className="overflow-x-hidden">
      <section className="w-full fm-section relative overflow-hidden" id="hero">
        {/* Premium Background (from FullMetrix) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* LIGHT MODE BACKGROUND */}
          <div className="absolute inset-0 block dark:hidden bg-zinc-50"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] rounded-full bg-violet-400/20 blur-[120px] dark:hidden animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50vw] h-[500px] rounded-full bg-fuchsia-400/10 blur-[100px] dark:hidden animate-[pulse_12s_ease-in-out_infinite] delay-1000"></div>

          {/* DARK MODE BACKGROUND */}
          <div className="absolute inset-0 hidden dark:block bg-[#0A0A0A]"></div>
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] max-h-[800px] rounded-[100%] bg-violet-900/30 blur-[150px] hidden dark:block animate-[pulse_10s_ease-in-out_infinite] mix-blend-screen"></div>
          <div className="absolute top-[30%] -right-[20%] w-[60vw] h-[60vw] max-h-[700px] rounded-[100%] bg-fuchsia-900/20 blur-[120px] hidden dark:block animate-[pulse_15s_ease-in-out_infinite] delay-1000 mix-blend-screen"></div>

          {/* SUBTLE GRID PATTERN (Clean & Modern) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_20%,#000_60%,transparent_100%)]"></div>
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
                min-[1130px]:grid-cols-[0.9fr_1.1fr]
                items-center
                gap-10 md:gap-12 min-[1130px]:gap-16
                will-change-transform
              "
            style={{ transform: "translateZ(0)" }}
          >
            {/* Colonne gauche (texte) */}
            <div className="relative z-20 min-w-0 min-[1130px]:order-none">
              <div className="flex flex-col items-center min-[1130px]:items-start text-center min-[1130px]:text-left w-full">
                <div className="space-y-4 sm:space-y-5 md:space-y-6 relative z-30 flex flex-col items-center min-[1130px]:items-start w-full">

                  <h1
                    data-cue="slide-up"
                    data-delay="80"
                    className="
                      text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem]
                      leading-[1.12] sm:leading-[1.08] lg:leading-[1.05]
                      font-extrabold tracking-[-0.02em]
                    "
                  >
                    <span className="text-skin-base drop-shadow-sm">Full Margin</span>
                    <br />
                    <span className="relative inline-block mt-1">
                      <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E879F9] to-[#A855F7] bg-[length:200%_auto] animate-[fm-text-shimmer_3s_linear_infinite] drop-shadow-sm font-black">
                        L’écosystème du trader moderne
                      </span>
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
                  className="mt-10 sm:mt-12 md:mt-14 w-full flex justify-center min-[1130px]:justify-start"
                  data-cue="fade"
                  data-delay="240"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center min-[1130px]:justify-start gap-4 sm:gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handlePrimary}
                      className="
                        relative group rounded-full px-5 sm:px-7 py-3 text-sm font-bold
                        bg-fm-primary text-white
                        overflow-hidden transition-all duration-300
                        hover:scale-105 hover:shadow-[0_0_20px_rgba(111,60,255,0.4)]
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                        w-full sm:w-auto text-center
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
                    <a
                      href="#features"
                      className="
                        group relative flex items-center justify-center gap-2
                        rounded-full px-5 sm:px-7 py-3 text-sm font-semibold
                        bg-transparent text-skin-base border border-skin-border/50
                        hover:bg-skin-surface/80 hover:border-skin-border
                        transition-all duration-300 backdrop-blur-sm
                        w-full sm:w-auto text-center
                      "
                    >
                      Découvrir
                      <svg className="w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Ticker */}
                <div
                  className="
                    mt-6 md:mt-7 min-[760px]:max-[1023px]:col-span-2
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
                hidden min-[1130px]:block
                order-last min-[1130px]:order-none
                min-w-0 w-full min-[1130px]:justify-self-end
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
      <section id="features" className="cv-auto fm-section scroll-mt-20">
        <FeatureShowcase />
      </section>

      {/* ===== COPY TRADERS + USER SPACE ===== */}
      <section className="cv-auto fm-section">
        <Avantage ctaHref="#ctrader" />
        <UserSpace ctaHref="/finance#accounts" />
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
