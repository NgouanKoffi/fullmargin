// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Demandes\DemandesShell.tsx
import React from "react";

export default function DemandesShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="rounded-3xl bg-white/80 dark:bg-slate-950/40 border border-slate-100/70 dark:border-slate-800/60 px-4 sm:px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}
