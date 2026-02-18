// src/components/community/MembersOnlyAlert.tsx
import type { ReactNode } from "react";
import { Info } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  icon?: ReactNode;
  className?: string;
};

export default function MembersOnlyAlert({
  title,
  description,
  ctaLabel,
  onCtaClick,
  icon,
  className,
}: Props) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border px-4 py-3 sm:px-6 sm:py-4
      bg-gradient-to-r from-rose-950/90 via-rose-900/85 to-rose-950/90
      border-rose-500/60 shadow-lg shadow-rose-900/40 text-rose-50 ${
        className ?? ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-rose-950/70 border border-rose-500/60">
          {icon ?? <Info className="h-4 w-4 text-rose-200" />}
        </div>

        <div>
          <div className="text-sm font-semibold">{title}</div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-rose-100/90">
              {description}
            </p>
          )}
        </div>
      </div>

      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs sm:text-sm font-semibold
          bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/40 transition"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
