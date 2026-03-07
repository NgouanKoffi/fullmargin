// src/pages/projets/composants/TaskDetails.tsx
import { CalendarDays, Tag, Image as ImageIcon } from "lucide-react";
import type { Tache } from "../types";
import { fmtDateFR } from "../date";

export default function TaskDetails({ task }: { task: Tache }) {
  return (
    <div className="grid gap-4 max-h-[65vh] overflow-y-auto overflow-x-hidden pr-1">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2">
        {task.etiquette && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100 px-3 py-1 text-xs">
            <Tag className="h-3.5 w-3.5" />
            {task.etiquette}
          </span>
        )}
        {task.priorite && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs capitalize">
            Priorité{" "}
            {task.priorite === "high"
              ? "haute"
              : task.priorite === "medium"
              ? "moyenne"
              : "faible"}
          </span>
        )}
        {task.echeance && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            Échéance {fmtDateFR(task.echeance)}
          </span>
        )}
      </div>

      {/* Image */}
      <div className="overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
        {task.imageUrl ? (
          <img
            src={task.imageUrl}
            alt={task.titre}
            className="w-full max-h-[360px] object-contain"
          />
        ) : (
          <div className="p-6 text-center text-sm opacity-60 flex flex-col items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Pas d’image
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-medium mb-1">Notes</h3>
        {task.notes ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-all">
            {task.notes}
          </p>
        ) : (
          <p className="text-sm opacity-60">Aucune note.</p>
        )}
      </div>
    </div>
  );
}
