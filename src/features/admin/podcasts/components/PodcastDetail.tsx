import type { Podcast } from "../types";
import { CalendarDays, Clock, Globe, Music2, CheckCircle2 } from "lucide-react";
import { fmtDuration } from "../utils";

export default function PodcastDetail({
  item,
  onClose,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  item: Podcast;
  onClose: () => void;
  onEdit: (p: Podcast) => void;
  onDelete: (p: Podcast) => void;
  onTogglePublish: (p: Podcast) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* ---- Couverture ---- */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="h-48 w-full object-cover sm:h-56 md:h-64"
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950/40 dark:to-indigo-950/40 sm:h-56 md:h-64" />
        )}
      </div>

      {/* ---- Infos sous l'image ---- */}
      <section className="rounded-2xl border bg-white/80 p-4 shadow-sm ring-1 ring-black/10 dark:border-white/10 dark:bg-neutral-900/60 dark:ring-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold sm:text-xl">{item.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-80">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {item.author || "Anonyme"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {fmtDuration(item.duration)}
              </span>

              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-800">
                {item.category}
              </span>

              <span
                className={
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 " +
                  (item.status === "publie"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-800"
                    : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-800")
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {item.status === "publie" ? "Publié" : "Brouillon"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={() => onTogglePublish(item)}
              className={
                "rounded-xl px-3 py-1.5 text-xs ring-1 " +
                (item.status === "publie"
                  ? "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-800"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-800")
              }
            >
              {item.status === "publie" ? "Mettre en brouillon" : "Publier"}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="rounded-xl px-3 py-1.5 text-xs ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
            >
              Éditer
            </button>
            <button
              onClick={() => onDelete(item)}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </section>

      {/* ---- Audio ---- */}
      <section className="rounded-2xl border p-4 ring-1 ring-black/10 dark:border-white/10 dark:ring-white/10">
        <div className="text-xs opacity-70">Lecture</div>
        <div className="mt-2 rounded-lg bg-black/5 p-3 dark:bg-white/5">
          {item.audioUrl ? (
            <audio controls src={item.audioUrl} className="w-full" />
          ) : (
            <div className="flex items-center gap-2 opacity-60">
              <Music2 className="h-5 w-5" />
              Aucun audio pour le moment
            </div>
          )}
        </div>
      </section>

      {/* ---- Description ---- */}
      <section className="rounded-2xl border ring-1 ring-black/10 dark:border-white/10 dark:ring-white/10">
        <div className="border-b px-4 py-3 text-xs opacity-70 dark:border-white/10">Description</div>
        <div
          className="prose max-w-none px-4 py-4 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: item.html || "<em>Aucune description…</em>" }}
        />
      </section>

      {/* ---- Footer actions ---- */}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => onTogglePublish(item)}
          className={
            "rounded-xl px-4 py-2 text-sm ring-1 " +
            (item.status === "publie"
              ? "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-800"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-800")
          }
        >
          {item.status === "publie" ? "Mettre en brouillon" : "Publier"}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
        >
          Éditer
        </button>
        <button
          onClick={() => onDelete(item)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Supprimer
        </button>
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}