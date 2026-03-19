// src/pages/admin/Messages/MailboxTab/panels/MailRow.tsx
import { CheckSquare, Square, Star, StarOff, MoreHorizontal, Trash2 } from "lucide-react";
import type { Mail } from "../types";
import { fmtDate } from "./utils";

type Props = {
  mail: Mail;
  selected: boolean;
  onToggleSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onOpen: () => void;
};

export default function MailRow({ mail, selected, onToggleSelect, onToggleStar, onDelete, onOpen }: Props) {
  const unread = !!mail.unread;

  return (
    <div
      className={[
        "border-b border-skin-border/10 transition",
        unread ? "bg-violet-50/70 dark:bg-violet-900/15" : "bg-transparent",
        selected ? "ring-1 ring-[#7c3aed]/30 bg-[#7c3aed]/10" : "",
        "hover:bg-skin-tile",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 px-3 py-2">
        {/* Checkbox + star */}
        <div className="shrink-0 flex items-center gap-3 pt-1">
          <button
            aria-label={selected ? "Désélectionner" : "Sélectionner"}
            onClick={onToggleSelect}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-skin-muted" />}
          </button>
          <button
            onClick={onToggleStar}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={mail.starred ? "Retirer des suivis" : "Marquer comme suivi"}
          >
            {mail.starred ? <Star className="w-4 h-4 text-amber-400" /> : <StarOff className="w-4 h-4 text-skin-muted" />}
          </button>
        </div>

        {/* Contenu cliquable */}
        <button className="min-w-0 flex-1 text-start" dir="auto" onClick={onOpen} title={`${mail.fromName} <${mail.fromEmail}>`}>
          {/* Expéditeur */}
          <div className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>{mail.fromName}</div>

          {/* Sujet + extrait */}
          <div className="text-sm truncate">
            <span className={unread ? "font-semibold" : "font-medium"}>{mail.subject}</span>
            <span className="text-skin-muted"> — {mail.snippet}</span>
          </div>

          {/* Date — TOUJOURS EN BAS */}
          <div className="mt-0.5 text-xs text-skin-muted tabular-nums">{fmtDate(mail.date)}</div>
        </button>

        {/* Actions à droite */}
        <div className="flex items-center gap-1 pt-1">
          <button
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
            title="Supprimer"
            aria-label="Supprimer"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
          <button className="p-1.5 rounded hover:bg-skin-tile" title="Plus d’actions" aria-label="Plus d’actions">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}