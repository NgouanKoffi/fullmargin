// src/pages/marketplace/public/components/ui/IconButton.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Size = "sm" | "md" | "lg";
type Variant = "subtle" | "solid";

export type IconButtonProps = {
  icon: ReactNode;
  badge?: number;
  size?: Size;
  variant?: Variant;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2",
  lg: "px-3.5 py-2.5",
};

const variantClasses: Record<Variant, string> = {
  subtle:
    // par défaut lisible (noir en clair / blanc en sombre)
    "border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100",
  solid:
    "border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100",
};

export default function IconButton({
  icon,
  badge,
  size = "md",
  variant = "subtle",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-xl",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {/* L’icône hérite la couleur du bouton */}
      <span className="pointer-events-none text-inherit">{icon}</span>

      {typeof badge === "number" && badge > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-violet-600 text-white text-[11px] leading-[20px] text-center px-1"
          aria-hidden="true"
        >
          {badge}
        </span>
      )}
    </button>
  );
}
