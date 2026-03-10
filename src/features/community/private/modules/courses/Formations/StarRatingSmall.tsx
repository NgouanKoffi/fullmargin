import { Star as StarIcon } from "lucide-react";

export function StarRatingSmall({
  value,
}: {
  value: number | null | undefined;
}) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));

  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={`${v}/5`}
      title={`${v}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={
            i <= v
              ? "h-3.5 w-3.5 fill-amber-400 stroke-amber-400"
              : "h-3.5 w-3.5 stroke-slate-400"
          }
        />
      ))}
    </span>
  );
}

export default StarRatingSmall;
