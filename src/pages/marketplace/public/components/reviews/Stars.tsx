import { memo } from "react";
import { Star } from "lucide-react";

export type StarsProps = {
  value: number; // 0..5
  size?: number;
  showValue?: boolean;
  className?: string;
};

const Stars = memo(function Stars({
  value,
  size = 16,
  showValue = false,
  className = "",
}: StarsProps) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const arr = Array.from({ length: 5 });

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {arr.map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className="shrink-0 text-amber-400"
            style={{ width: size, height: size }}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm opacity-80">{value.toFixed(1)}/5</span>
      )}
    </div>
  );
});

export default Stars;
