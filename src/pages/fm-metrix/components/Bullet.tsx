// src/pages/fm-metrix/components/Bullet.tsx
import type React from "react";
import { ChevronRight } from "lucide-react";

export default function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="
          mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full
          bg-violet-600/15 text-violet-700 ring-1 ring-violet-500/20
          dark:bg-violet-600/25 dark:text-violet-200 dark:ring-violet-500/30
        "
      >
        <ChevronRight className="h-4 w-4" />
      </span>
      <span className="text-zinc-900/80 dark:text-white/85">{children}</span>
    </li>
  );
}
