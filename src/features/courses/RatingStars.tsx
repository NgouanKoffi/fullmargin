// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\course\RatingStars.tsx
import { Star } from "lucide-react";

export function RatingStars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value || 0));
  const full = Math.round(clamped);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        return (
          <span
            key={i}
            className="relative inline-flex h-4 w-4 items-center justify-center"
          >
            <Star
              className={[
                "h-4 w-4 transition-transform",
                filled
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] animate-pulse"
                  : "text-slate-500/70",
              ].join(" ")}
            />
          </span>
        );
      })}
    </div>
  );
}
