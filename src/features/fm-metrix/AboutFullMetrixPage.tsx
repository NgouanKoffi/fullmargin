// src/pages/fm-metrix/AboutFullMetrixPage.tsx
import HeroFullMetrix from "./sections/HeroFullMetrix";
import FeatureGrid2x2 from "./sections/FeatureGrid2x2";
import ChatAgentSection from "./sections/ChatAgentSection";
import StrategieHubSection from "./sections/StrategieHubSection";
import FmMetrixFooter from "./sections/FmMetrixFooter";
import { useFullMetrixRedirect } from "./hooks/useFullMetrixRedirect";

export default function AboutFullMetrixPage() {
  const { goToFM, isLoading } = useFullMetrixRedirect();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <HeroFullMetrix goToFM={goToFM} isLoading={isLoading} />
      <FeatureGrid2x2 goToFM={goToFM} isLoading={isLoading} />
      <ChatAgentSection goToFM={goToFM} isLoading={isLoading} />
      <StrategieHubSection goToFM={goToFM} isLoading={isLoading} />

      {/* Footer comme sur ton image */}
      <FmMetrixFooter goToFM={goToFM} isLoading={isLoading} />
    </div>
  );
}
