import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackConsent } from "../lib/analytics"; // ajuste le chemin si besoin

type Props = {
  onClose?: () => void;
};

export default function CookieConsentBanner({ onClose }: Props) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) setShowBanner(true);
    } catch (e) {
      // si localStorage indispo, on affiche quand même
      if (import.meta.env?.DEV) console.warn("[cookie] read failed:", e);
      setShowBanner(true);
    }
  }, []);

  const notify = (status: "accepted" | "declined") => {
    // event custom si tu veux réagir ailleurs dans l’app
    window.dispatchEvent(
      new CustomEvent("fm:cookie-consent", { detail: { status } })
    );
  };

  const handleAccept = () => {
    try {
      localStorage.setItem("cookieConsent", "accepted");
    } catch (e) {
      if (import.meta.env?.DEV)
        console.warn("[cookie] write failed (accept):", e);
    }
    // log immédiat côté backend
    trackConsent("accepted");
    notify("accepted");
    setShowBanner(false);
    onClose?.();
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("cookieConsent", "declined");
    } catch (e) {
      if (import.meta.env?.DEV)
        console.warn("[cookie] write failed (decline):", e);
    }
    // log immédiat côté backend
    trackConsent("declined");
    notify("declined");
    setShowBanner(false);
    onClose?.();
  };

  if (!showBanner) return null;

  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        w-full
        max-w-[90%] sm:max-w-xl md:max-w-2xl
        bg-neutral-900/90 backdrop-blur-md text-white
        border border-white/10 shadow-lg
        rounded-2xl px-6 py-5
        animate-fadeIn
      "
      role="dialog"
      aria-live="polite"
      aria-label="Bannière de consentement aux cookies"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* TEXTE */}
        <p className="text-sm leading-snug sm:leading-normal">
          Nous utilisons des cookies pour améliorer votre expérience sur{" "}
          <strong>FullMargin</strong>. En continuant, vous acceptez notre{" "}
          <Link
            to="/confidentialite"
            className="underline underline-offset-2 hover:text-indigo-400 transition"
          >
            politique de confidentialité
          </Link>
          .
        </p>

        {/* BOUTONS */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <button
            onClick={handleAccept}
            className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition"
          >
            Accepter
          </button>
          <button
            onClick={handleDecline}
            className="bg-white/10 border border-white/20 text-white text-sm px-5 py-2 rounded-full hover:bg-white/20 transition"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
