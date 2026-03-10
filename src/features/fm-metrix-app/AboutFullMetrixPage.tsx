"use client";

import React, { useState, useEffect } from "react";
import HeroFullMetrix from "./sections/HeroFullMetrix";
import FeatureGrid2x2 from "./sections/FeatureGrid2x2";
import ChatAgentSection from "./sections/ChatAgentSection";
import StrategieHubSection from "./sections/StrategieHubSection";
import FmMetrixFooter from "./sections/FmMetrixFooter";
import { useFullMetrixRedirect } from "./hooks/useFullMetrixRedirect";

export default function AboutFullMetrixPage() {
  const { goToFM, isLoading } = useFullMetrixRedirect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-black" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black relative">
      <HeroFullMetrix goToFM={goToFM} isLoading={isLoading} />
      <FeatureGrid2x2 goToFM={goToFM} isLoading={isLoading} />
      <ChatAgentSection goToFM={goToFM} isLoading={isLoading} />
      <StrategieHubSection goToFM={goToFM} isLoading={isLoading} />
      <FmMetrixFooter goToFM={goToFM} isLoading={isLoading} />
    </div>
  );
}
