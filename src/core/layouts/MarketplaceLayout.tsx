// src/core/layouts/MarketplaceLayout.tsx
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

/* ---------- Layout public (Marketplace) ---------- */
export default function MarketplaceLayout() {
  useAnalytics();

  return (
    <>
      {/* En-tête global du site (même que PrivateLayout) */}
      <Header />
      <ScrollToTop />

      {/* Contenu Marketplace (les pages /marketplace s’affichent ici) */}
      <main className="min-h-[100dvh]">
        <Outlet />
      </main>

      {/* Modals globaux (connexion + 2FA si l’utilisateur se connecte depuis le marketplace) */}
      <AuthModal />
      <TwoFactorModal />

      {/* Cookies */}
      <CookieConsentBanner />

      {/* Recherche plein écran */}
      <SearchOverlay />
    </>
  );
}
