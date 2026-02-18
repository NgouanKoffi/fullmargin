// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\ui\FavoriteButton.tsx
import { Heart } from "lucide-react";

export type IconButtonVariant = "solid" | "subtle";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  count?: number;
  variant?: IconButtonVariant;
  className?: string;
};

export default function FavoriteButton({
  count = 0,
  variant = "subtle",
  className = "",
  ...btn
}: Props) {
  const base =
    "relative inline-flex items-center justify-center rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 focus:outline-none transition";
  const style =
    variant === "solid"
      ? "bg-rose-500 hover:bg-rose-500 text-white"
      : "bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

  return (
    <button type="button" {...btn} className={`${base} ${style} ${className}`}>
      <Heart className="w-5 h-5 shrink-0" />
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-rose-500 text-white text-[11px] leading-[20px] text-center px-1"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
