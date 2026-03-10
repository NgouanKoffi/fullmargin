// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\dashboard\ChartCard.tsx
import * as React from "react";

export default function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-black/10 dark:border-white/10">
        <div className="font-semibold text-sm sm:text-base">{title}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-500">{subtitle}</div>
        ) : null}
      </div>
      {/* Centrer le contenu (utile pour le donut surtout) */}
      <div className="px-2 sm:px-3 py-2 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
