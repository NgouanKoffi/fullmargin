// src/pages/journal/tabs/view/FiltersBar.tsx
import { useState } from "react";
import {
  ORDRE_OPTIONS,
  RESULT_OPTIONS,
  RESPECT_OPTIONS,
  SESSION_OPTIONS,
  type Option,
} from "../../types";
import {
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import type { Filters } from "./filters";
import { EMPTY_FILTERS } from "./filters";

export default function FiltersBar({
  filters,
  setFilters,
  accountOptions,
  marketOptions,
  strategyOptions,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  accountOptions: Option[];
  marketOptions: Option[];
  strategyOptions: Option[];
}) {
  // 👇 barre pliable
  const [open, setOpen] = useState(false); // ✅ Fermé par défaut pour cohérence

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-3 space-y-3">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* contenu pliable */}
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
          <SelectField
            label="Compte"
            value={filters.accountId}
            onChange={(v) => setFilters((s) => ({ ...s, accountId: v }))}
            options={accountOptions}
          />
          <SelectField
            label="Marché"
            value={filters.marketId}
            onChange={(v) => setFilters((s) => ({ ...s, marketId: v }))}
            options={marketOptions}
          />
          <SelectField
            label="Stratégie"
            value={filters.strategyId}
            onChange={(v) => setFilters((s) => ({ ...s, strategyId: v }))}
            options={strategyOptions}
          />

          <div className="grid grid-cols-2 gap-2">
            <InputDate
              label="Du"
              value={filters.from}
              onChange={(v) => setFilters((s) => ({ ...s, from: v }))}
            />
            <InputDate
              label="Au"
              value={filters.to}
              onChange={(v) => setFilters((s) => ({ ...s, to: v }))}
            />
          </div>

          <SelectField
            label="Ordre"
            value={filters.order}
            onChange={(v) =>
              setFilters((s) => ({ ...s, order: v as Filters["order"] }))
            }
            options={[
              { id: "", name: "— Tous —" },
              ...ORDRE_OPTIONS.map((o) => ({ id: o, name: o })),
            ]}
          />

          <SelectField
            label="Résultat"
            value={filters.result}
            onChange={(v) =>
              setFilters((s) => ({ ...s, result: v as Filters["result"] }))
            }
            options={[
              { id: "", name: "— Tous —" },
              ...RESULT_OPTIONS.map((o) => ({ id: o, name: o })),
            ]}
          />

          <SelectField
            label="Respect"
            value={filters.respect}
            onChange={(v) =>
              setFilters((s) => ({ ...s, respect: v as Filters["respect"] }))
            }
            options={[
              { id: "", name: "— Tous —" },
              ...RESPECT_OPTIONS.map((o) => ({ id: o, name: o })),
            ]}
          />

          <SelectField
            label="Session"
            value={filters.session}
            onChange={(v) =>
              setFilters((s) => ({ ...s, session: v as Filters["session"] }))
            }
            options={[
              { id: "", name: "— Toutes —" },
              ...SESSION_OPTIONS.map((s) => ({ id: s.value, name: s.label })),
            ]}
          />
        </div>
      )}

      {/* bouton reset visible aussi quand c’est fermé (mobile) */}
      <div className="flex items-center justify-end sm:hidden">
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="inline-flex items-center gap-2 rounded-full px-4 h-9 text-xs font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Réinitialiser tous les filtres"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.id || o.name} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase text-slate-500">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm dark:[color-scheme:dark]"
      />
    </div>
  );
}
