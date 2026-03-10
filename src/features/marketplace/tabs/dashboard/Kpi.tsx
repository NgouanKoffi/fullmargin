// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\dashboard\Kpi.tsx
import * as React from "react";

export default function Kpi({
  icon,
  title,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  tone?: "neutral" | "success" | "warning" | "danger" | "muted" | "indigo";
}) {
  const toneStyles: Record<
    string,
    { pillBg: string; pillText: string; iconBg: string }
  > = {
    neutral: {
      pillBg: "bg-neutral-100 dark:bg-neutral-900/50",
      pillText: "text-neutral-700 dark:text-neutral-300",
      iconBg: "bg-neutral-200/70 dark:bg-neutral-700/60",
    },
    success: {
      pillBg: "bg-emerald-50 dark:bg-emerald-900/20",
      pillText: "text-emerald-700 dark:text-emerald-200",
      iconBg: "bg-emerald-200/70 dark:bg-emerald-700/60",
    },
    warning: {
      pillBg: "bg-amber-50 dark:bg-amber-900/20",
      pillText: "text-amber-700 dark:text-amber-200",
      iconBg: "bg-amber-200/70 dark:bg-amber-700/60",
    },
    danger: {
      pillBg: "bg-rose-50 dark:bg-rose-900/20",
      pillText: "text-rose-700 dark:text-rose-200",
      iconBg: "bg-rose-200/70 dark:bg-rose-700/60",
    },
    muted: {
      pillBg: "bg-neutral-50 dark:bg-neutral-900/30",
      pillText: "text-neutral-600 dark:text-neutral-300",
      iconBg: "bg-neutral-200/70 dark:bg-neutral-700/60",
    },
    indigo: {
      pillBg: "bg-indigo-50 dark:bg-indigo-900/20",
      pillText: "text-indigo-700 dark:text-indigo-200",
      iconBg: "bg-indigo-200/70 dark:bg-indigo-700/60",
    },
  };
  const t = toneStyles[tone];

  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10 p-3 sm:p-4 min-h-[104px] sm:min-h-[120px] flex flex-col">
      <div
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium ${t.pillBg} ${t.pillText}`}
      >
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${t.iconBg}`}
        >
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-auto pt-2 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
        {value}
      </div>
    </div>
  );
}
