// src/pages/podcasts/MobilePlayerFab.tsx
import { AudioLines } from "lucide-react";
import { cx } from "./utils";
import type { Podcast } from "./types";
import React from "react";

export default function MobilePlayerFab({
  current,
  isPlaying,
  onPress,
}: {
  current: Podcast | null;
  isPlaying: boolean;
  onPress: () => void;
}) {
  if (!current) return null;

  // ➕ Position “un peu plus haut” + safe areas
  const fabStyle: React.CSSProperties = {
    // un cran plus haut qu’avant
    bottom: "calc(env(safe-area-inset-bottom, 0px) + clamp(84px, 9vh, 120px))",
    right: "calc(env(safe-area-inset-right, 0px) + 14px)",
  };

  return (
    <>
      {/* CSS local : tu peux déplacer ça dans GlobalStyles si tu veux */}
      <style>{`
        @keyframes fmEq1 { 0%{transform:scaleY(.4)} 25%{transform:scaleY(.9)} 50%{transform:scaleY(.55)} 75%{transform:scaleY(.8)} 100%{transform:scaleY(.4)} }
        @keyframes fmEq2 { 0%{transform:scaleY(.65)} 25%{transform:scaleY(.45)} 50%{transform:scaleY(1)} 75%{transform:scaleY(.5)} 100%{transform:scaleY(.65)} }
        @keyframes fmEq3 { 0%{transform:scaleY(.5)} 20%{transform:scaleY(.85)} 45%{transform:scaleY(.55)} 70%{transform:scaleY(.95)} 100%{transform:scaleY(.5)} }

        /* barre de base */
        .eqbar {
          width: 3px;
          border-radius: 2px;
          background: currentColor;
          opacity: .95;
          transform-origin: 50% 100%;
          will-change: transform;
        }

        /* variations */
        .eqrun .b1 { animation: fmEq1 1000ms infinite ease-in-out; }
        .eqrun .b2 { animation: fmEq2 1000ms infinite ease-in-out; }
        .eqrun .b3 { animation: fmEq3 1000ms infinite ease-in-out; }

        /* accessibilité : désactiver si l’utilisateur préfère moins d’animations */
        @media (prefers-reduced-motion: reduce) {
          .eqrun .b1, .eqrun .b2, .eqrun .b3 { animation: none; }
        }

        /* halo animé très léger autour du FAB quand ça joue */
        .fm-fab-playing::after{
          content:"";
          position:absolute; inset:-6px;
          border-radius:9999px;
          background:
            conic-gradient(from 0deg, rgba(255,255,255,.25), rgba(255,255,255,0) 60% 100%);
          filter: blur(6px);
          opacity:.55;
          animation: fmSpin 3.2s linear infinite;
          pointer-events:none;
        }
        @keyframes fmSpin { to{ transform: rotate(360deg); } }
      `}</style>

      <button
        onClick={onPress}
        className={cx(
          "md:hidden fixed z-50 h-12 w-12 rounded-full",
          "bg-fm-primary text-skin-primary-foreground",
          "ring-1 ring-white/20 shadow-xl grid place-items-center",
          "active:scale-95 transition",
          isPlaying && "fm-fab-playing"
        )}
        style={fabStyle}
        aria-label="Ouvrir le lecteur"
        title="Ouvrir le lecteur"
      >
        {isPlaying ? (
          // Égaliseur animé (visible uniquement en lecture)
          <div
            className={cx(
              "absolute inset-0 flex items-center justify-center gap-[3px]",
              "eqrun"
            )}
          >
            <span className="eqbar b1" style={{ height: "38%" }} />
            <span className="eqbar b2" style={{ height: "56%" }} />
            <span className="eqbar b3" style={{ height: "34%" }} />
          </div>
        ) : (
          // Icône quand c'est en pause
          <AudioLines className="h-5 w-5" />
        )}
      </button>
    </>
  );
}
