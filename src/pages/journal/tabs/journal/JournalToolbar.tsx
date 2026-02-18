// src/pages/journal/tabs/journal/JournalToolbar.tsx
import { useEffect, useState } from "react";
import {
  Plus,
  Download,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import type { Option } from "../../types";
import { listJournalAccounts, listMarkets, listStrategies } from "../../api";
import {
  ORDRE_OPTIONS,
  RESULT_OPTIONS,
  RESPECT_OPTIONS,
  SESSION_OPTIONS,
} from "../../types";

type Props = {
  q: string;
  setQ: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;

  accountId: string;
  setAccountId: (v: string) => void;
  marketId: string;
  setMarketId: (v: string) => void;
  strategyId: string;
  setStrategyId: (v: string) => void;

  order: string;
  setOrder: (v: string) => void;
  result: string;
  setResult: (v: string) => void;
  respect: string;
  setRespect: (v: string) => void;

  session: string;
  setSession: (v: string) => void;

  onNew: () => void;
  onExport: () => void;
  onReset: () => void;
};

export default function JournalToolbar(props: Props) {
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [markets, setMarkets] = useState<Option[]>([]);
  const [strats, setStrats] = useState<Option[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false); // ✅ Fermé par défaut pour cohérence

  useEffect(() => {
    (async () => {
      try {
        const [{ items: accs }, { items: mkts }, { items: sts }] =
          await Promise.all([
            listJournalAccounts({ limit: 200 }),
            listMarkets({ limit: 200 }),
            listStrategies({ limit: 200 }),
          ]);

        setAccounts(
          [{ id: "", name: "— Tous —" }].concat(
            accs.map((a) => ({ id: a.id, name: a.name }))
          )
        );
        setMarkets(
          [{ id: "", name: "— Tous —" }].concat(
            mkts.map((m) => ({ id: m.id, name: m.name }))
          )
        );
        setStrats(
          [{ id: "", name: "— Toutes —" }].concat(
            sts.map((s) => ({ id: s.id, name: s.name }))
          )
        );
      } catch (e) {
        console.warn("[JournalToolbar] chargement filtres API échoué :", e);
        setAccounts([{ id: "", name: "— Tous —" }]);
        setMarkets([{ id: "", name: "— Tous —" }]);
        setStrats([{ id: "", name: "— Toutes —" }]);
      }
    })();
  }, []);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-3 space-y-3">
      {/* ligne actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 min-w-0">
        <button
          onClick={props.onNew}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-violet-600 text-white border-violet-600 hover:bg-violet-500 shrink-0"
        >
          <Plus className="w-4 h-4" /> Nouveau journal
        </button>

        <button
          onClick={props.onExport}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
        >
          <Download className="w-4 h-4" />
          (PDF)
        </button>

        <div className="relative min-w-[260px] shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            placeholder="Recherche texte…"
            value={props.q}
            onChange={(e) => props.setQ(e.target.value)}
            className="h-10 w-full pl-9 pr-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* bouton réinitialiser */}
        <button
          onClick={props.onReset}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          title="Réinitialiser tous les filtres"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>

        {/* bouton plier / déplier les filtres */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0 ml-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {filtersOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ligne filtres (pliable + scrollable) */}
      {filtersOpen && (
        <div className="max-h-52 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
            <Select
              label="Compte"
              value={props.accountId}
              onChange={props.setAccountId}
              options={accounts}
            />
            <Select
              label="Marché"
              value={props.marketId}
              onChange={props.setMarketId}
              options={markets}
            />
            <Select
              label="Stratégie"
              value={props.strategyId}
              onChange={props.setStrategyId}
              options={strats}
            />
            <div className="grid grid-cols-2 gap-2">
              <InputDate
                label="Du"
                value={props.from}
                onChange={props.setFrom}
              />
              <InputDate label="Au" value={props.to} onChange={props.setTo} />
            </div>

            <Select
              label="Ordre"
              value={props.order}
              onChange={props.setOrder}
              options={["", ...ORDRE_OPTIONS].map((v) => ({
                id: v,
                name: v || "— Tous —",
              }))}
            />
            <Select
              label="Résultat"
              value={props.result}
              onChange={props.setResult}
              options={["", ...RESULT_OPTIONS].map((v) => ({
                id: v,
                name: v || "— Tous —",
              }))}
            />
            <Select
              label="Respect"
              value={props.respect}
              onChange={props.setRespect}
              options={["", ...RESPECT_OPTIONS].map((v) => ({
                id: v,
                name: v || "— Tous —",
              }))}
            />
            <Select
              label="Session"
              value={props.session}
              onChange={props.setSession}
              options={[
                { id: "", name: "— Toutes —" },
                ...SESSION_OPTIONS.map((s) => ({ id: s.value, name: s.label })),
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
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
      <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-900 dark:text-slate-100"
      >
        {options.map((o) => (
          <option key={o.id + o.name} value={o.id}>
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
      <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700
          bg-white dark:bg-slate-900 px-2 text-sm text-slate-900 dark:text-slate-100
          dark:[&::-webkit-calendar-picker-indicator]:invert
          dark:[&::-webkit-calendar-picker-indicator]:opacity-100
        `}
      />
    </div>
  );
}
