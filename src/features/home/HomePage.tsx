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
import SEO from "@shared/components/SEO";

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
      <SEO 
        title="L'écosystème ultime du trader moderne"
        description="Le premier écosystème tout-en-un pour les traders, entrepreneurs et investisseurs. Journaling intelligent, analyse prédictive et communauté exclusive."
        keywords="trading, journal de trading, crypto, forex, analyse technique, boursière, fullmargin, trader d'élite"
      />
      {/* ===== HERO ===== */}
      <section className="w-full fm-section" id="hero">
        <div
          className="
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
              lg:grid-cols-[1.05fr_0.95fr]
              items-center
              gap-6 md:gap-8 lg:gap-10
              will-change-transform
            "
            style={{ transform: "translateZ(0)" }}
          >
            {/* Colonne gauche (texte) */}
            <div className="min-w-0 lg:order-none">
              <div
                className="
                  min-[760px]:max-[1023px]:grid
                  min-[760px]:max-[1023px]:grid-cols-[1fr_auto]
                  min-[760px]:max-[1023px]:gap-8
                "
              >
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <span
                    data-cue="fade"
                    className="inline-flex items-center text-[11px] md:text-xs font-medium px-2 py-1 rounded-full ring-1 ring-skin-border/20 bg-skin-surface/70"
                  >
                    L’excellence
                  </span>

                  <h1
                    data-cue="slide-up"
                    data-delay="80"
                    className="
                      text-3xl sm:text-5xl lg:text-6xl
                      leading-[1.18] sm:leading-[1.12] lg:leading-[1.08]
                      font-extrabold tracking-[-0.015em] text-skin-base
                    "
                  >
                    Full Margin —<br /> L’écosystème du
                    <br /> trader moderne
                  </h1>

                  <p
                    data-cue="fade"
                    data-delay="160"
                    className="
                      text-base sm:text-lg leading-relaxed text-skin-muted
                      max-w-[52ch]
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
                    mt-10 sm:mt-12 md:mt-14
                    min-[760px]:max-[1023px]:mt-14
                    min-[760px]:max-[1023px]:justify-self-end
                  "
                  data-cue="fade"
                  data-delay="240"
                >
                  <div
                    className="
                      flex flex-wrap items-center gap-3
                      min-[760px]:max-[1023px]:flex-col
                      min-[760px]:max-[1023px]:items-end
                      min-[760px]:max-[1023px]:gap-2
                    "
                  >
                    <button
                      type="button"
                      onClick={handlePrimary}
                      className="
                        rounded-full px-5 py-3 text-sm font-semibold
                        bg-fm-primary text-skin-primary-foreground hover:opacity-90
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                        text-center min-[760px]:max-[1023px]:w-56
                      "
                    >
                      Commencer maintenant
                    </button>
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
    </main>
  );
}
