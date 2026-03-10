// src/pages/fm-metrix/AboutFullMetrixPage.tsx
import HeroFullMetrix from "./sections/HeroFullMetrix";
import FeatureGrid2x2 from "./sections/FeatureGrid2x2";
import ChatAgentSection from "./sections/ChatAgentSection";
import StrategieHubSection from "./sections/StrategieHubSection";
import Footer from "@shared/components/Footer";
import { useFullMetrixRedirect } from "./hooks/useFullMetrixRedirect";
import SEO from "@shared/components/SEO";

export default function AboutFullMetrixPage() {
  const { goToFM, isLoading } = useFullMetrixRedirect();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 font-sans selection:bg-violet-500/30 overflow-hidden">
      <SEO 
        title="FullMetrix | Le meilleur Journal de Trading intelligent"
        description="Poussez vos analyses de trading au niveau supérieur avec FullMetrix. Journaling automatisé, assistant IA et statistiques de performance avancées."
        keywords="journal de trading, journal de trading automatique, trading journal, trading analytics, fullmetrix, trader d'élite"
      />
      <HeroFullMetrix goToFM={goToFM} isLoading={isLoading} />
      <FeatureGrid2x2 goToFM={goToFM} isLoading={isLoading} />
      <ChatAgentSection goToFM={goToFM} isLoading={isLoading} />
      <StrategieHubSection goToFM={goToFM} isLoading={isLoading} />
      <Footer />
    </div>
  );
}
