// src/pages/communaute/public/community-details/components/IconBtn.tsx
import React from "react";

export default function IconBtn({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="rounded-lg bg-slate-100 px-2.5 py-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
