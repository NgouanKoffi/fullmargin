// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\podcasts\MobilePlayerDrawer.tsx
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { Podcast } from "./types";
import { fmtTime } from "./utils";

export default function MobilePlayerDrawer({
  open,
  onClose,
  current,
  isPlaying,
  onToggle,
  onPrev,
  onNext,
  positionSec = 0,
  durationSec = 0,
  onSeek,
}: {
  open: boolean;
  onClose: () => void;
  current: Podcast | null;
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** ⏱️ position courante (sec) */
  positionSec?: number;
  /** ⏱️ durée totale (sec) */
  durationSec?: number;
  /** Seek absolu en secondes */
  onSeek: (sec: number) => void;
}) {
  // ⚠️ Pas de early-return avant les hooks (on rend null tout en bas)
  const pct =
    durationSec > 0
      ? Math.max(0, Math.min(100, (positionSec / durationSec) * 100))
      : 0;

  const prettyLeft = fmtTime(Math.floor(positionSec || 0));
  const prettyRight = fmtTime(Math.floor(durationSec || 0));

  if (!open || !current) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[380px] max-w-[92vw] bg-skin-surface ring-1 ring-skin-border/20 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-skin-border/20 flex items-center gap-2">
          <div className="h-8 w-8 rounded-md overflow-hidden">
            <img src={current.cover} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate text-skin-base">
              {current.title}
            </div>
            <div className="text-xs text-skin-muted truncate">
              {current.artist}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-skin-inset"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Cover */}
          <img
            src={current.cover}
            className="w-full aspect-square object-cover rounded-2xl"
          />

          {/* Temps + Progress */}
          <div className="px-1">
            <div className="flex items-center justify-between text-xs text-skin-muted mb-2">
              <span>{prettyLeft}</span>
              <span>{prettyRight}</span>
            </div>

            {/* Barre de progression robuste (2 calques) */}
            <div className="relative h-6 select-none">
              {/* Track de base */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-skin-border/30" />
              {/* Remplissage */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-fm-primary"
                style={{ width: `${pct}%` }}
              />
              {/* Slider transparent par-dessus pour le drag */}
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={pct}
                onChange={(e) => {
                  const nextPct = Number(e.currentTarget.value);
                  if (!Number.isFinite(nextPct) || durationSec <= 0) return;
                  const sec = (nextPct / 100) * durationSec;
                  onSeek(sec);
                }}
                className="fm-range absolute inset-0 w-full h-6 bg-transparent appearance-none cursor-pointer"
                aria-label="Position"
              />
            </div>

            {/* Styles du thumb & track (le track est transparent) */}
            <style>{`
              .fm-range { -webkit-tap-highlight-color: transparent; }
              .fm-range::-webkit-slider-runnable-track { height: 6px; background: transparent; border: 0; }
              .fm-range::-moz-range-track { height: 6px; background: transparent; border: 0; }
              .fm-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px; height: 18px; border-radius: 9999px;
                background: rgb(var(--fm-primary));
                border: 2px solid rgba(255,255,255,.85);
                box-shadow: 0 1px 4px rgba(0,0,0,.25);
                margin-top: -6px; /* centre le thumb sur une hauteur de 6px */
              }
              .fm-range:active::-webkit-slider-thumb { transform: scale(1.04); }
              .fm-range::-moz-range-thumb {
                width: 18px; height: 18px; border-radius: 9999px;
                background: rgb(var(--fm-primary));
                border: 2px solid rgba(255,255,255,.85);
                box-shadow: 0 1px 4px rgba(0,0,0,.25);
              }
            `}</style>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onPrev}
              className="p-3 rounded-full ring-1 ring-skin-border/20"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={onToggle}
              className="h-12 w-12 rounded-full bg-fm-primary text-skin-primary-foreground grid place-items-center"
              aria-label={isPlaying ? "Pause" : "Lecture"}
              title={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={onNext}
              className="p-3 rounded-full ring-1 ring-skin-border/20"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
