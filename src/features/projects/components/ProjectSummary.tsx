import { CheckCircle2, ListTodo, PlayCircle, RefreshCcw } from "lucide-react";
import type { Projet } from "../types";

type Props = {
  projet?: Projet;
  pct: number;
  allDone: boolean;
  globalLabel: string;
  done: number;
  total: number;
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
};

export function ProjectSummary({
  projet,
  pct,
  allDone,
  globalLabel,
  done,
  total,
  todoCount,
  inProgressCount,
  reviewCount,
  doneCount,
}: Props) {
  if (!projet) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 mt-4 grid grid-cols-1 gap-3">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-4">
        <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mb-3">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full transition-all ${
              allDone
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-violet-600 to-indigo-600"
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 text-sm ${
              allDone
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/30"
                : total === 0
                ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-400/30"
                : "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-400/30"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {globalLabel}
          </div>

          <span className="rounded-md px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 text-sm">
            Avancement : {done}/{total} ({pct}%)
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
            <ListTodo className="h-4 w-4 opacity-70" />
            <span className="text-sm">À faire</span>
            <span className="ml-auto font-semibold">{todoCount}</span>
          </div>
          <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
            <PlayCircle className="h-4 w-4 opacity-70" />
            <span className="text-sm">En cours</span>
            <span className="ml-auto font-semibold">{inProgressCount}</span>
          </div>
          <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 opacity-70" />
            <span className="text-sm">À revoir</span>
            <span className="ml-auto font-semibold">{reviewCount}</span>
          </div>
          <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 opacity-70" />
            <span className="text-sm">Terminé</span>
            <span className="ml-auto font-semibold">{doneCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
