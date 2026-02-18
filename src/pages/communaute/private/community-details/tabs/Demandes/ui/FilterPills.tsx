import React from "react";
import { Filter as FilterIcon } from "lucide-react";

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto whitespace-nowrap no-scrollbar">
      <FilterIcon className="w-4 h-4 opacity-60 shrink-0" />
      {children}
    </div>
  );
}

export function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center px-3 h-8 rounded-full text-xs font-medium transition
      ${
        active
          ? "bg-violet-600 text-white"
          : "bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-900/70"
      }`}
    >
      {label}
    </button>
  );
}
