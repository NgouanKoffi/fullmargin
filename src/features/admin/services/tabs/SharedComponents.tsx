// src/pages/admin/tabs/SharedComponents.tsx
import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-xl p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function StatusPill({ status = "offline" }: { status?: "online" | "away" | "offline" }) {
  const color =
    status === "online" ? "bg-emerald-500" : status === "away" ? "bg-amber-500" : "bg-slate-400";
  const label = status === "online" ? "En ligne" : status === "away" ? "Absent" : "Hors ligne";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-slate-200 dark:border-slate-700">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">{children}</h2>;
}