// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./router/routes";
import NotificationCenter from "./components/Notification";
import { PlayerProvider } from "./player/PlayerProvider";

// ✅ Lazy: évite de payer ces composants dans le bundle initial
const GlobalPlayerUI = lazy(() => import("./player/GlobalPlayerUI"));
const FloatingSideButton = lazy(
  () => import("./components/FloatingSideButton")
);

export default function App() {
  const { pathname } = useLocation();

  // ✅ Signal fiable pour cacher le loader (après un paint)
  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("fm:app-mounted"));
    });
  }, []);

  const showPlayer =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/player");

  return (
    <AuthProvider>
      <PlayerProvider>
        <NotificationCenter />

        {/* ✅ IMPORTANT : routes lazy */}
        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>

        {showPlayer && (
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
