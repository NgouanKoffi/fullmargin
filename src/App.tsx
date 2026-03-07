// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "@core/auth/AuthContext";
import AppRoutes from "@core/router/routes";
import NotificationCenter from "@shared/components/Notification";
import { PlayerProvider } from "@core/player/PlayerProvider";

// Lazy: évite de payer ces composants dans le bundle initial
const GlobalPlayerUI = lazy(() => import("@core/player/GlobalPlayerUI"));
const FloatingSideButton = lazy(
  () => import("@shared/components/FloatingSideButton"),
);

export default function App() {
  const { pathname } = useLocation();

  // Signal fiable pour cacher le loader (après un paint)
  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("fm:app-mounted"));
    });
  }, []);

  // On exclut le mini-player uniquement sur des routes de plein écran ou d'auth si besoin
  const hidePlayer =
    pathname.startsWith("/connexion") || pathname.startsWith("/inscription");

  return (
    <AuthProvider>
      <PlayerProvider>
        <NotificationCenter />

        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>

        {/* On affiche le player globalement (il se cache tout seul si "current" est null) */}
        {!hidePlayer && (
          <Suspense fallback={null}>
            <GlobalPlayerUI />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <FloatingSideButton />
        </Suspense>
      </PlayerProvider>
    </AuthProvider>
  );
}
