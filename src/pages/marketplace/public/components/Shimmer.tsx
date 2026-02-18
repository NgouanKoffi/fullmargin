import type { HTMLAttributes } from "react";

export default function Shimmer({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/50 ${className}`}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
