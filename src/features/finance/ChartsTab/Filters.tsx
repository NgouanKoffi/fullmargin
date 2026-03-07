// src/pages/finance/ChartsTab/Filters.tsx
import { useState } from "react";
import { SlidersHorizontal, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import type { Account, Recurrence, TxDetail, TxType } from "../core/types";

export default function Filters({
  accounts,
  setQ,
  acc,
  setAcc,
  type,
  setType,
  detail,
  setDetail,
  rec,
  setRec,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}: {
  accounts: Account[];
  q: string;
  setQ: (v: string) => void;
  acc: string;
  setAcc: (v: string) => void;
  type: "" | TxType;
  setType: (v: "" | TxType) => void;
  detail: "" | TxDetail;
  setDetail: (v: "" | TxDetail) => void;
  rec: "" | Recurrence;
  setRec: (v: "" | Recurrence) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
}) {
  const [open, setOpen] = useState(false); // ✅ Fermé par défaut pour cohérence

  const reset = () => {
    setQ("");
    setAcc("");
    setType("");
    setDetail("");
    setRec("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div
      className="rounded-2xl p-4 shadow-sm
                 ring-1 ring-slate-200/70 dark:ring-slate-700/50
                 bg-slate-50 dark:bg-slate-800/60"
    >
      {/* ligne de tête : boutons */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          title="Réinitialiser tous les filtres"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-3 h-10 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shrink-0"
          title={open ? "Masquer les filtres" : "Afficher les filtres"}
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

      {open && (
        <div
          className="
            grid gap-3
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            2xl:grid-cols-5
          "
        >
          <select
            value={acc}
            onChange={(e) => setAcc(e.target.value)}
            className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Tous les comptes</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as "" | TxType)}
            className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Tous types</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
          </select>

          <select
            value={detail}
            onChange={(e) => setDetail(e.target.value as "" | TxDetail)}
            className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Tous détails</option>
            <option value="epargne">Epargne</option>
            <option value="assurance">Assurance</option>
            <option value="retrait">Retrait</option>
            <option value="dette">Dette</option>
            <option value="investissement">Investissement</option>
            <option value="autre">Autre</option>
          </select>

          <select
            value={rec}
            onChange={(e) => setRec(e.target.value as "" | Recurrence)}
            className="h-10 w-full rounded-lg px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Toutes récurrences</option>
            <option value="fixe">Fixe</option>
            <option value="mensuel">Mensuel</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:[color-scheme:dark]"
          />


        </div>
      )}
    </div>
  );
}
