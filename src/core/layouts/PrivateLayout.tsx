// src/core/layouts/PrivateLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";

import Header from "@shared/components/Header";
import AuthModal from "@core/auth/AuthModal";
import TwoFactorModal from "@core/auth/ui/modals/TwoFactor/TwoFactorModal";
import CookieConsentBanner from "@shared/components/CookieConsentBanner";
import SearchOverlay from "@shared/components/search/SearchOverlay";
import useAnalytics from "@core/analytics/useAnalytics";

/* ---------- Remonte en haut à chaque navigation ---------- */
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

/* ---------- Layout privé (auth requis) — sans support client ---------- */
export default function PrivateLayout() {
  useAnalytics();

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

      {/* Cookies */}
      <CookieConsentBanner />

      {/* Recherche plein écran */}
      <SearchOverlay />

      {/* ❌ Pas de composant de Support Client ici */}
      {/* ❌ Pas de boutons/sidebars Admin */}
    </>
  );
}