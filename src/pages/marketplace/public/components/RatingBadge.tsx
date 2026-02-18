import { memo } from "react";
import { Star } from "lucide-react";

export type RatingBadgeProps = {
  rating?: number; // moyenne sur 5
  count?: number; // nb d'avis
  className?: string;
};

/** Affiche "★ 4.2 / 5 · 12" ; masque totalement si count <= 0 */
const RatingBadge = memo(function RatingBadge({
  rating = 0,
  count = 0,
  className = "",
}: RatingBadgeProps) {
  if (!count || count <= 0) return null;

  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const text = `${value.toFixed(1)}  · ${count}`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-black/70 text-white px-2.5 py-1 text-xs font-semibold ring-1 ring-white/10 ${className}`}
      title={text}
    >
      <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
      {text}
    </span>
  );
});

export default RatingBadge;
