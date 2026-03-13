// src/pages/fm-metrix/AboutFullMetrixPage.tsx
import HeroFullMetrix from "./sections/HeroFullMetrix";
import FeatureGrid2x2 from "./sections/FeatureGrid2x2";
import ChatAgentSection from "./sections/ChatAgentSection";
import StrategieHubSection from "./sections/StrategieHubSection";
import FmMetrixFooter from "./sections/FmMetrixFooter";
import { useFullMetrixRedirect } from "./hooks/useFullMetrixRedirect";
import SEO from "@shared/components/SEO";

export default function AboutFullMetrixPage() {
  const { goToFM, isLoading } = useFullMetrixRedirect();

  return (
    <div className="min-h-screen relative text-zinc-900 dark:text-zinc-100 transition-colors duration-500 font-sans selection:bg-violet-500/30 overflow-hidden">
      {/* GLOBAL BACKGROUND ENVIRONMENT (Unified) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden fixed">
        {/* LIGHT MODE BACKGROUND */}
        <div className="absolute inset-0 block dark:hidden bg-zinc-50"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] rounded-full bg-violet-400/20 blur-[120px] dark:hidden animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-[20%] -left-[10%] w-[50vw] h-[500px] rounded-full bg-fuchsia-400/10 blur-[100px] dark:hidden animate-[pulse_12s_ease-in-out_infinite] delay-1000"></div>

        {/* DARK MODE BACKGROUND */}
        <div className="absolute inset-0 hidden dark:block bg-[#0A0A0A]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] max-h-[800px] rounded-[100%] bg-violet-900/30 blur-[150px] hidden dark:block animate-[pulse_10s_ease-in-out_infinite] mix-blend-screen"></div>
        <div className="absolute top-[30%] -right-[20%] w-[60vw] h-[60vw] max-h-[700px] rounded-[100%] bg-fuchsia-900/20 blur-[120px] hidden dark:block animate-[pulse_15s_ease-in-out_infinite] delay-1000 mix-blend-screen"></div>

        {/* SUBTLE GRID PATTERN (Clean & Modern) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_20%,#000_60%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 w-full h-full">
        <SEO 
          title="FullMetrix | Le meilleur Journal de Trading intelligent"
          description="Poussez vos analyses de trading au niveau supérieur avec FullMetrix. Journaling automatisé, assistant IA et statistiques de performance avancées."
          keywords="journal de trading, journal de trading automatique, trading journal, trading analytics, fullmetrix, trader d'élite"
        />
        <HeroFullMetrix goToFM={goToFM} isLoading={isLoading} />
        <FeatureGrid2x2 goToFM={goToFM} isLoading={isLoading} />
        <ChatAgentSection />
        <StrategieHubSection />
        <FmMetrixFooter goToFM={goToFM} isLoading={isLoading} />
      </div>
    </div>
  );
}
