// src/core/layouts/FmMetrixLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";

import Header from "@shared/components/Header";
// ✅ pas de Footer ici
import AuthModal from "@core/auth/AuthModal";
import TwoFactorModal from "@core/auth/ui/modals/TwoFactor/TwoFactorModal";
import SupportClient from "@shared/components/Support/SupportClient";
import SupportPanel from "@shared/components/Support/SupportPanel";
import CookieConsentBanner from "@shared/components/CookieConsentBanner";
import SearchOverlay from "@shared/components/search/SearchOverlay";
import useAnalytics from "@core/analytics/useAnalytics";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function FmMetrixLayout() {
  useAnalytics();

  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setSupportOpen(true);
    window.addEventListener("fm:open-support", onOpen as EventListener);
    return () =>
      window.removeEventListener("fm:open-support", onOpen as EventListener);
  }, []);

  const handleCloseSupport = () => {
    setSupportOpen(false);
    window.dispatchEvent(new CustomEvent("fm:close-support"));
  };

  return (
    <>
      <Header />
      <ScrollToTop />

      <main className="min-h-[100dvh]">
        <Outlet />
      </main>

      {/* Modals globaux */}
      <AuthModal />
      <TwoFactorModal />

      {/* ✅ PAS DE FOOTER */}

      {/* Support */}
      <SupportPanel open={supportOpen} onClose={handleCloseSupport} />
      <SupportClient />

      {/* Cookies */}
      <CookieConsentBanner />

      {/* Recherche plein écran */}
      <SearchOverlay />
    </>
  );
}
