// C:\Users\ADMIN\Desktop\fullmargin-site\src\layouts\AdminLayout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";

import Header from "../components/Header";
import AuthModal from "../auth/AuthModal";
import TwoFactorModal from "../auth/ui/modals/TwoFactor/TwoFactorModal";
import CookieConsentBanner from "../components/CookieConsentBanner";
import SearchOverlay from "../components/search/SearchOverlay";
import useAnalytics from "../hooks/useAnalytics";
import SidebarGestion from "../components/Header/SidebarGestion";
import AdminGestionFab from "../components/Header/AdminGestionFab";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if ("scrollRestoration" in window.history)
      window.history.scrollRestoration = "manual";
  }, []);
  useLayoutEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function AdminLayout() {
  useAnalytics();

  // Ouvre la sidebar UNIQUEMENT si on arrive avec ?open=gestion,
  // puis enlève le paramètre via navigate(..., { replace: true }) pour éviter les ré-ouvertures.
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const shouldOpen = sp.get("open") === "gestion";
    if (!shouldOpen) return;

    // Ouvrir la sidebar
    window.dispatchEvent(new CustomEvent("fm:open-gestion"));

    // Nettoyer l'URL proprement (synchronisé avec React Router)
    sp.delete("open");
    const nextSearch = sp.toString();
    const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}${
      location.hash || ""
    }`;
    navigate(nextUrl, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

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

      {/* Bouton flottant d’accès direct à la gestion */}
      <AdminGestionFab />

      {/* Sidebar admin (toggle via fm:open-gestion) */}
      <SidebarGestion />
    </>
  );
}
