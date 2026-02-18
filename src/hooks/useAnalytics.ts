import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackLeave, trackPageview } from "../lib/analytics";

export default function useAnalytics() {
  const { pathname } = useLocation();

  const startedAtRef = useRef<number>(Date.now());
  const leaveSentForStartRef = useRef<number>(0);

  useEffect(() => {
    const pathNow = pathname;

    // Pageview (2 args max)
    trackPageview(pathNow, document.referrer || undefined);

    // (re)démarre le séjour
    startedAtRef.current = Date.now();
    leaveSentForStartRef.current = 0;

    // Envoi unique du "leave" pour ce séjour
    const sendLeave = () => {
      if (leaveSentForStartRef.current === startedAtRef.current) return;
      leaveSentForStartRef.current = startedAtRef.current;
      trackLeave(pathNow, startedAtRef.current); // 2 args max
    };

    const sendLeaveIfHidden = () => {
      if (typeof document.visibilityState === "string" && document.visibilityState !== "hidden") return;
      sendLeave();
    };

    const onVisibility = () => sendLeaveIfHidden();
    const onPageHide = () => sendLeaveIfHidden();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // Sur changement de route SPA, on force l’envoi (même si visible)
      sendLeave();
    };
  }, [pathname]);
}