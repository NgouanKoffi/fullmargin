// src/pages/communaute/public/community-details/tabs/Formations/composants/BottomBar.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BottomBar({
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  className = "",
}: {
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  className?: string;
}) {
  return (
    <div className={`mt-5 flex items-center justify-between ${className}`}>
      <button
        onClick={onPrev}
        disabled={disablePrev}
        aria-label="Étape précédente"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={onNext}
        disabled={disableNext}
        aria-label="Étape suivante"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
