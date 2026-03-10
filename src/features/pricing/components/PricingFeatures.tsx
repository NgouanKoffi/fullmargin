import type React from "react";
import { Check } from "lucide-react";

export function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start p-2 rounded-xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02]">
      <div className="flex w-6 h-6 items-center justify-center rounded-full ring-1 bg-emerald-50/70 text-emerald-500 ring-emerald-400/25 dark:bg-emerald-500/5 shrink-0">
        <Check className="w-3.5 h-3.5" />
      </div>
      <span className="text-skin-base dark:text-slate-200/90">{children}</span>
    </li>
  );
}

export function ProFeature({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start p-2 rounded-xl ring-1 ring-skin-border/20 dark:ring-white/10 bg-white/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 transition-colors">
      <div className="flex w-6 h-6 items-center justify-center rounded-full ring-1 bg-fm-primary/10 text-fm-primary ring-fm-primary/15 shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-skin-base dark:text-slate-200/90">{children}</span>
    </li>
  );
}
