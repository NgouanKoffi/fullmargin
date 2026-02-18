// src/pages/journal/tabs/journal/JournalForm/Fields.tsx
import { CalendarDays } from "lucide-react";
import type { Option } from "../../../types";

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label} {required ? "*" : null}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 text-sm"
      >
        {/* 👇 toujours une option vide pour que React puisse passer de "" à un vrai id */}
        <option value="">
          {options.length === 0 ? "— Aucun —" : "— Sélectionner —"}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-500">
        <CalendarDays className="h-4 w-4 opacity-70" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none flex-1 text-sm text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
        />
      </div>
    </div>
  );
}
