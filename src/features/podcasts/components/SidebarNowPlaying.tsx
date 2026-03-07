// src/pages/podcasts/SidebarNowPlaying.tsx
import React from "react";
import { Pause, Play, SkipBack, SkipForward, Headphones } from "lucide-react";
import { fmtTime } from "../utils/utils";
import type { Podcast } from "../types";

type Props = {
  current: Podcast | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (sec: number) => void;
};

export default function SidebarNowPlaying({
  current,
  isPlaying,
  positionSec,
  durationSec,
  onToggle,
  onPrev,
  onNext,
  onSeek,
}: Props) {
  if (!current) return null;

  // 🛡️ Sécurité contre les erreurs NaN
  const safeDuration = durationSec && !isNaN(durationSec) ? durationSec : 0;
  const safePosition = positionSec && !isNaN(positionSec) ? positionSec : 0;

  const pct =
    safeDuration > 0
      ? Math.max(0, Math.min(100, (safePosition / safeDuration) * 100))
      : 0;

  return (
    <aside
      className="hidden md:block rounded-xl p-3 bg-skin-inset/70 ring-1 ring-skin-border/30"
      aria-label="Lecture en cours (sidebar)"
    >
      <style>{`
        .fm-mini-range {
          -webkit-appearance: none; appearance: none; width: 100%;
          height: 8px; border-radius: 9999px; background: var(--fm-mini-bg, rgba(120,120,120,.25));
          outline: none;
        }
        .fm-mini-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: transparent; }
        .fm-mini-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; margin-top: -4px;
          border-radius: 9999px; background: rgb(var(--fm-primary));
          border: 2px solid rgba(255,255,255,.95); box-shadow: 0 1px 4px rgba(0,0,0,.35);
        }
        .fm-mini-range:active::-webkit-slider-thumb { transform: scale(1.05); }
        .fm-mini-range::-moz-range-track { height: 8px; border-radius: 9999px; background: transparent; }
        .fm-mini-range::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 9999px;
          background: rgb(var(--fm-primary)); border: 2px solid rgba(255,255,255,.95);
          box-shadow: 0 1px 4px rgba(0,0,0,.35);
        }
      `}</style>

      <div className="flex items-center gap-3">
        {current.cover ? (
          <img
            src={current.cover}
            alt=""
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-black/5"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-skin-tile-strong" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight truncate text-skin-base">
            {current.title ?? "Épisode en cours"}
          </div>
          {current.artist && (
            <div className="text-xs text-skin-muted truncate flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5" />
              <span>{current.artist}</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto h-9 w-9 rounded-full bg-fm-primary text-skin-primary-foreground grid place-items-center"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-skin-muted mb-1">
          <span>{fmtTime(Math.floor(safePosition))}</span>
          <span>{fmtTime(Math.floor(safeDuration))}</span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0.1, safeDuration)}
          step={0.1}
          value={Math.min(safePosition, safeDuration)}
          onChange={(e) => onSeek(Number(e.currentTarget.value))}
          className="fm-mini-range w-full cursor-pointer"
          style={
            {
              background: `linear-gradient(to right, rgb(var(--fm-primary)) 0%, rgb(var(--fm-primary)) ${pct}%, rgba(120,120,120,0.25) ${pct}%, rgba(120,120,120,0.25) 100%)`,
            } as React.CSSProperties
          }
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-full hover:bg-skin-inset"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-full hover:bg-skin-inset"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[11px] text-skin-muted">
            {isPlaying ? "Lecture…" : "En pause"}
          </span>
        </div>
      </div>
    </aside>
  );
}
