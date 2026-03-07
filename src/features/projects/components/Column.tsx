import { Plus } from "lucide-react";
import type { Statut, Tache } from "../types";
import TaskCard from "./TaskCard";

const LABELS: Record<Statut, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "À revoir",
  done: "Terminé",
};

const HEAD_BG: Record<Statut, string> = {
  todo: "bg-gradient-to-r from-sky-500 to-sky-600",
  in_progress: "bg-gradient-to-r from-violet-600 to-indigo-600",
  review: "bg-gradient-to-r from-amber-500 to-orange-600",
  done: "bg-gradient-to-r from-emerald-600 to-green-600",
};
const HEAD_TEXT: Record<Statut, string> = {
  todo: "text-white",
  in_progress: "text-white",
  review: "text-slate-900",
  done: "text-white",
};

export default function Column({
  statut,
  taches,
  onAdd,
  onToggleDone,
  onMove,
  onEdit,
  onDelete,
  onDropTask,
  onView,
}: {
  statut: Statut;
  taches: Tache[];
  onAdd: () => void;
  onToggleDone: (t: Tache) => void;
  onMove: (t: Tache, to: Statut) => void;
  onEdit: (t: Tache) => void;
  onDelete: (t: Tache) => void;
  onDropTask: (taskId: string, from: Statut, to: Statut) => void;
  onView?: (t: Tache) => void; // 👈 nouveau
}) {
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).dataset.drop = "1";
  }
  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    delete (e.currentTarget as HTMLDivElement).dataset.drop;
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dt = e.dataTransfer;
    const taskId = dt.getData("text/id");
    const from = (dt.getData("text/from") as Statut) || "todo";
    delete (e.currentTarget as HTMLDivElement).dataset.drop;
    if (taskId) onDropTask(taskId, from, statut);
  }

  return (
    <section
      className="
        self-start
        rounded-2xl border-2 border-slate-300 dark:border-slate-700
        bg-white/90 dark:bg-neutral-900/90 backdrop-blur
        shadow-sm hover:shadow-md transition-shadow
        overflow-visible
      "
      aria-label={LABELS[statut]}
    >
      <div
        className={`
          ${HEAD_BG[statut]} ${HEAD_TEXT[statut]}
          rounded-t-2xl px-3 py-2.5
          flex items-center justify-between gap-2
          border-b border-slate-200/60 dark:border-slate-700/80
        `}
      >
        <div className="font-semibold">
          {LABELS[statut]}{" "}
          <span
            className={`ml-1 inline-block rounded-full px-2 py-0.5 text-xs ring-1 ${
              HEAD_TEXT[statut] === "text-white"
                ? "bg-white/15 ring-white/30 text-white/90"
                : "bg-white/60 ring-black/10 text-slate-900"
            }`}
          >
            {taches.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm ring-1 ${
            HEAD_TEXT[statut] === "text-white"
              ? "bg-white/10 ring-white/30 hover:bg-white/15 text-white"
              : "bg-black/5 ring-black/10 hover:bg-black/10 text-slate-900"
          }`}
          title={`Ajouter dans « ${LABELS[statut]} »`}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="
          p-3 space-y-3 min-h-16 rounded-b-2xl
          data-[drop='1']:outline data-[drop='1']:outline-2
          data-[drop='1']:outline-indigo-400/70 data-[drop='1']:outline-offset-[-2px]
        "
      >
        {taches.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/id", t.id);
              e.dataTransfer.setData("text/from", t.statut);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <TaskCard
              t={t}
              onToggleDone={onToggleDone}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
