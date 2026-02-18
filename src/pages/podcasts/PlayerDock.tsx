// src/pages/podcasts/PlayerDock.tsx
import React, { useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { Podcast } from "./types";
import { fmtTime } from "./utils";
import { NavLink } from "react-router-dom";

type Props = {
  current: Podcast | null;
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void; // DOIT pointer vers player.quit
  positionSec?: number;
  durationSec?: number;
  onSeek?: (sec: number) => void;
};

export default function PlayerDock({
  current,
  isPlaying,
  onToggle,
  onPrev,
  onNext,
  onClose,
  positionSec = 0,
  durationSec = 0,
  onSeek,
}: Props) {
  // Hooks toujours en haut, jamais conditionnels
  const [open, setOpen] = useState(false);

  const pct = useMemo(() => {
    if (!durationSec || durationSec <= 0) return 0;
    return Math.max(0, Math.min(1, (positionSec || 0) / durationSec));
  }, [positionSec, durationSec]);

  // On peut faire un early-return APRÈS les hooks
  if (!current) return null;

  const RIGHT_GAP = 12;
  const circlePos: React.CSSProperties = {
    right: `calc(env(safe-area-inset-right, 0px) + ${RIGHT_GAP}px)`,
    bottom:
      "calc(env(safe-area-inset-bottom, 0px) + var(--player-fab-bottom, 72px))",
  };
  const panelPos: React.CSSProperties = {
    right: `calc(env(safe-area-inset-right, 0px) + ${RIGHT_GAP}px)`,
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
    width: "min(420px, 92vw)",
  };

  const R = 30;
  const C = 2 * Math.PI * R;
  const dash = C * (1 - pct);

  return (
    <>
      {/* CERCLE (toggle panneau) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[1000] h-[64px] w-[64px] rounded-full shadow-2xl ring-1 ring-black/10 bg-skin-surface/95 backdrop-blur grid place-items-center active:scale-95 transition"
        style={circlePos}
        aria-label={open ? "Replier le lecteur" : "Ouvrir le lecteur"}
        aria-expanded={open}
        title={open ? "Replier" : "Ouvrir"}
      >
        <svg
          className="absolute inset-0"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r={R}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={R}
            stroke="rgb(var(--fm-primary))"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: C,
              strokeDashoffset: dash,
              transition: "stroke-dashoffset 160ms linear",
              transform: "rotate(-90deg)",
              transformOrigin: "32px 32px",
            }}
          />
        </svg>

        <div className="relative">
          <img
            src={current.cover}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10"
          />
        </div>
      </button>

      {/* PANNEAU */}
      <div
        className={`fixed z-[1000] rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface/95 backdrop-blur shadow-2xl p-4 transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        style={panelPos}
        role="region"
        aria-label="Lecteur"
      >
        {/* Ranger (replie seulement) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          className="absolute right-2 top-2 p-2 rounded-full hover:bg-skin-inset text-skin-base/90 ring-1 ring-skin-border/20"
          title="Ranger"
          aria-label="Ranger"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header cliquable */}
        <NavLink
          to="/podcasts"
          className="flex items-center gap-3 min-w-0 flex-1"
          title="Ouvrir la page Podcasts"
          onClick={() => setOpen(false)}
        >
          <img
            src={current.cover}
            alt=""
            className="h-10 w-10 rounded-lg object-cover shrink-0 ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-skin-base">
              {current.title}
            </div>
            <div className="text-xs text-skin-muted truncate">
              {current.artist}
            </div>
          </div>
        </NavLink>

        {/* Progress */}
        {durationSec > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-skin-muted leading-none mb-1">
              <span>{fmtTime(positionSec)}</span>
              <span>{fmtTime(durationSec)}</span>
            </div>
            <div className="relative h-3 select-none">
              <div className="absolute inset-0 rounded-full bg-skin-border/40" />
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-fm-primary"
                style={{ width: `${pct * 100}%` }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 block h-4 w-4 rounded-full bg-fm-primary border-2 border-white shadow"
                style={{ left: `calc(${pct * 100}% - 8px)` }}
                aria-hidden
              />
              <input
                type="range"
                min={0}
                max={Math.max(0.1, durationSec)}
                step={0.1}
                value={Math.min(positionSec, durationSec)}
                onChange={(e) => onSeek?.(Number(e.currentTarget.value))}
                className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
                aria-label="Chercher dans l’audio"
              />
            </div>
          </div>
        )}

        {/* Contrôles */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={onPrev}
            className="p-2 rounded-full hover:bg-skin-inset"
            title="Précédent"
            aria-label="Précédent"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={onToggle}
            className="h-10 w-10 rounded-full bg-fm-primary text-skin-primary-foreground grid place-items-center"
            title={isPlaying ? "Pause" : "Lecture"}
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={onNext}
            className="p-2 rounded-full hover:bg-skin-inset"
            title="Suivant"
            aria-label="Suivant"
          >
            <SkipForward className="h-5 w-5" />
          </button>
          {/* Fermer total */}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-skin-inset"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}
