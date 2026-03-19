// src/core/layouts/MarketplaceLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";

import Header from "@shared/components/Header";
import Footer from "@shared/components/Footer";
import AuthModal from "@core/auth/AuthModal";
import TwoFactorModal from "@core/auth/ui/modals/TwoFactor/TwoFactorModal";
import SupportClient from "@shared/components/Support/SupportClient";
import SupportPanel from "@shared/components/Support/SupportPanel";
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
    <div className="flex flex-col min-h-screen">
      {/* En-tête global du site (même que PrivateLayout) */}
      <Header />
      <ScrollToTop />

      {/* Contenu Marketplace (les pages /marketplace s’affichent ici) */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer global */}
      <Footer />

      {/* Modals globaux (connexion + 2FA si l’utilisateur se connecte depuis le marketplace) */}
      <AuthModal />
      <TwoFactorModal />

      {/* Support */}
      <SupportPanel open={supportOpen} onClose={handleCloseSupport} />
      <SupportClient />

      {/* Cookies */}
      <CookieConsentBanner />

      {/* Recherche plein écran */}
      <SearchOverlay />
    </div>
  );
}
