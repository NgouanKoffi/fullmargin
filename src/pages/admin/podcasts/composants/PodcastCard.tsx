// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\podcasts\composants\PodcastCard.tsx
import {
  CalendarDays,
  Clock,
  Edit,
  Music2,
  Trash2,
  User as UserIcon,
  Globe,
} from "lucide-react";
import type { Podcast } from "../types";
import { fmtDuration } from "../utils";

type AuditAwarePodcast = Podcast;

function ellipsizeMiddle(s: string, max = 32) {
  if (!s) return "";
  if (s.length <= max) return s;
  const keep = Math.max(4, Math.floor((max - 1) / 2));
  return s.slice(0, keep) + "… " + s.slice(-keep);
}

export default function PodcastCard({
  item,
  currentUserId,
  onEdit,
  onDelete,
  onTogglePublish,
  onOpen,
}: {
  item: AuditAwarePodcast;
  currentUserId?: string;
  onEdit: (p: AuditAwarePodcast) => void;
  onDelete: (p: AuditAwarePodcast) => void;
  onTogglePublish: (p: AuditAwarePodcast) => void;
  onOpen?: (p: AuditAwarePodcast) => void;
}) {
  const open = () => onOpen?.(item);

  // créateur
  const creatorId = item.createdById || item.userId;
  const isSelf = currentUserId && creatorId && currentUserId === creatorId;
  const rawCreator =
    item.createdByName ||
    item.createdByEmail ||
    (creatorId ? `ID ${String(creatorId).slice(-6)}` : "Inconnu");
  const creatorLabel = isSelf ? "Moi" : rawCreator;

  // styles boutons
  const publishBtnClass =
    "rounded-xl px-3 py-1.5 text-xs ring-1 transition-colors " +
    (item.status === "publie"
      ? "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-800"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-800");

  const statusPillClass =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 " +
    (item.status === "publie"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-800"
      : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-800");

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border bg-white/80 p-4 sm:p-4 shadow-sm ring-1 ring-black/10 backdrop-blur transition hover:ring-violet-300 dark:border-white/5 dark:bg-neutral-900/60 dark:ring-white/10"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      {/* haut */}
      <div className="relative z-10 flex items-start gap-3 sm:gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10">
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-black/5 dark:bg-white/5">
              <Music2 className="h-6 w-6 opacity-60" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{item.title}</h3>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-800">
              {item.category}
            </span>
            <span className={statusPillClass}>
              {item.status === "publie" ? "Publié" : "Brouillon"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-70">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(item.createdAt).toLocaleDateString()}
            </span>

            {item.author ? (
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate max-w-[38vw]" title={item.author}>
                  {item.author}
                </span>
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {fmtDuration(item.duration)}
            </span>
          </div>
        </div>
      </div>

      {/* bas */}
      <div
        className="
          relative z-10 mt-3
          flex flex-wrap gap-2
        "
      >
        {/* auteur */}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1 text-xs opacity-70">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="truncate block" title={rawCreator}>
              {ellipsizeMiddle(creatorLabel, 26)}
            </span>
          </div>
        </div>

        {/* actions : on force la ligne suivante sur petits écrans */}
        <div className="w-full flex flex-wrap gap-2 sm:gap-2">
          {/* Brouillon / Publier */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublish(item);
            }}
            className={publishBtnClass + " shrink-0"}
            type="button"
          >
            {item.status === "publie" ? "Brouillon" : "Publier"}
          </button>

          {/* icône éditer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            type="button"
            className="inline-flex items-center justify-center rounded-xl w-9 h-9 ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
            aria-label="Éditer le podcast"
            title="Éditer"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* icône supprimer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            type="button"
            className="inline-flex items-center justify-center rounded-xl w-9 h-9 bg-red-600 text-white hover:bg-red-700"
            aria-label="Supprimer le podcast"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
