import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";

import Header from "../components/Header";
import AuthModal from "../auth/AuthModal";
import TwoFactorModal from "../auth/ui/modals/TwoFactor/TwoFactorModal";
import CookieConsentBanner from "../components/CookieConsentBanner";
import SearchOverlay from "../components/search/SearchOverlay";
import useAnalytics from "../hooks/useAnalytics";

/* Remonte en haut à chaque navigation */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function CommunauteLayout() {
  useAnalytics();

  return (
    <>
      <Header />
      <ScrollToTop />
      <main className="min-h-[100dvh]">
        <Outlet />
      </main>

      <AuthModal />
      <TwoFactorModal />
      <CookieConsentBanner />
      <SearchOverlay />
    </>
  );
}
