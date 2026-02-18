// src/pages/finance/ActionTab/CardTx.tsx
import {
  AlignLeft,
  Calendar,
  CheckCircle2,
  CircleSlash2,
  Edit3,
  Repeat,
  Trash2,
  Wallet2,
} from "lucide-react";
import type { Currency, Transaction } from "../core/types";

/* styles dynamiques */
function typeChipCls(t: Transaction["type"]) {
  return t === "income"
    ? "bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-300 ring-emerald-200/60 dark:ring-emerald-800/50"
    : "bg-rose-50 dark:bg-rose-900/15 text-rose-700 dark:text-rose-300 ring-rose-200/60 dark:ring-rose-800/50";
}
function recChip(r: Transaction["recurrence"]) {
  return r === "mensuel"
    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-violet-200/60 dark:ring-violet-800/60"
    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-700/60";
}
function toneByType(t: Transaction["type"]) {
  return t === "expense"
    ? {
        card: "bg-rose-50/50 dark:bg-rose-900/10",
        amount: "text-rose-700 dark:text-rose-300",
        stripe: "from-rose-500 to-rose-400",
      }
    : {
        card: "bg-emerald-50/50 dark:bg-emerald-900/10",
        amount: "text-emerald-700 dark:text-emerald-300",
        stripe: "from-emerald-500 to-emerald-400",
      };
}

export default function CardTx({
  tx,
  accountName,
  money,
  dateStr,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  accountName: string;
  currency: Currency;
  money: string;
  dateStr: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tone = toneByType(tx.type);

  return (
    <article className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition hover:shadow-lg">
      {/* bandeau haut */}
      <div className={`h-1 w-full bg-gradient-to-r ${tone.stripe}`} />

      {/* header (date + badges + actions) */}
      <header className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <Calendar className="w-4 h-4" />
              <span className="whitespace-nowrap">{dateStr}</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              {/* type */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 whitespace-nowrap ${typeChipCls(
                  tx.type
                )}`}
              >
                {tx.type === "income" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <CircleSlash2 className="w-3.5 h-3.5" />
                )}
                {tx.type === "income" ? "Revenu" : "Dépense"}
              </span>

              {/* récurrence */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 whitespace-nowrap ${recChip(
                  tx.recurrence
                )}`}
              >
                <Repeat className="w-3.5 h-3.5" />
                {tx.recurrence === "mensuel" ? "Mensuel" : "Fixe"}
              </span>

              {/* détail */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 whitespace-nowrap bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-700/60 capitalize">
                <AlignLeft className="w-3.5 h-3.5" /> {tx.detail}
              </span>
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-end gap-2 sm:row-span-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Modifier"
              aria-label="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
              title="Supprimer"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pb-4">
        {/* === BLOC COMPTE / MONTANT (2 lignes) === */}
        <div
          className={`rounded-xl ${tone.card} border border-slate-200 dark:border-slate-700 p-3 mb-3`}
        >
          {/* ligne 1 : icône + nom */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 grid place-items-center rounded-xl text-white shadow-sm bg-gradient-to-br from-slate-700 to-slate-500 flex-shrink-0">
              <Wallet2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold leading-tight truncate">
              {accountName}
            </div>
          </div>

          {/* ligne 2 : montant seul */}
          <div
            className={`mt-2 text-lg font-semibold tabular-nums leading-tight break-words ${tone.amount}`}
          >
            {money}
          </div>
        </div>

        {/* commentaire */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Commentaire
          </div>
          {tx.comment ? (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
              {tx.comment}
            </p>
          ) : (
            <p className="text-sm italic text-slate-400">Aucun commentaire.</p>
          )}
        </div>
      </div>
    </article>
  );
}
