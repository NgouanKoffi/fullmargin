// C:\Users\ADMIN\Desktop\fullmargin-site\src\layouts\DefaultLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
// import BackgroundFX from "../components/decor/BackgroundFX";
import AuthModal from "../auth/AuthModal";
import TwoFactorModal from "../auth/ui/modals/TwoFactor/TwoFactorModal";
import SupportClient from "../components/Support/SupportClient";
import SupportPanel from "../components/Support/SupportPanel";
import CookieConsentBanner from "../components/CookieConsentBanner";
import SearchOverlay from "../components/search/SearchOverlay";
import useAnalytics from "../hooks/useAnalytics";

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

export default function DefaultLayout() {
  useAnalytics(); // pageview + durée

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
      {/* <BackgroundFX /> */}
      <ScrollToTop />

      <main className="min-h-[100dvh]">
        <Outlet />
      </main>

      {/* Modals globaux */}
      <AuthModal />
      <TwoFactorModal />
      <Footer />

      {/* Support */}
      <SupportPanel open={supportOpen} onClose={handleCloseSupport} />
      <SupportClient />

      {/* Cookies */}
      <CookieConsentBanner />

      {/* Recherche plein écran */}
      <SearchOverlay />

      {/* NOTE: Les sidebars Admin/Service vivent dans leurs layouts dédiés (AdminLayout/ServiceLayout). */}
    </>
  );
}
