// src/pages/journal/tabs/journal/JournalTable/Lightbox.tsx
import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Id } from "../../../types";
import { classNames } from "./helpers";

export type LightboxState =
  | { open: false }
  | { open: true; entryId: Id; index: number };

export function Lightbox({
  state,
  onClose,
  getUrls,
  setIndex,
}: {
  state: LightboxState;
  onClose: () => void;
  getUrls: (entryId: Id) => string[];
  setIndex: (n: number) => void;
}) {
  const open = state.open;
  const urls = open ? getUrls(state.entryId) : [];
  const idx = open
    ? Math.max(0, Math.min(state.index, Math.max(0, urls.length - 1)))
    : 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex(idx - 1);
      if (e.key === "ArrowRight") setIndex(idx + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, idx, onClose, setIndex]);

  if (!open) return null;
  const src = urls[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < urls.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm grid place-items-center p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl max-h-[88vh] grid place-items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="max-h-[82vh] w-auto object-contain rounded-xl shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
          <button
            onClick={() => hasPrev && setIndex(idx - 1)}
            disabled={!hasPrev}
            className={classNames(
              "pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full border bg-white/90 dark:bg-slate-900/80",
              hasPrev
                ? "border-slate-200 dark:border-slate-700"
                : "opacity-40 border-transparent"
            )}
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => hasNext && setIndex(idx + 1)}
            disabled={!hasNext}
            className={classNames(
              "pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full border bg-white/90 dark:bg-slate-900/80",
              hasNext
                ? "border-slate-200 dark:border-slate-700"
                : "opacity-40 border-transparent"
            )}
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded bg-black/60 text-white">
          {idx + 1} / {urls.length}
        </div>
      </div>
    </div>
  );
}
