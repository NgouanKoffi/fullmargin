// src/pages/admin/Messages/MailboxTab/panels/MailerComposer/parts/Attachments.tsx
import { Paperclip, XCircle } from "lucide-react";
import type { Attachment } from "../types";

// Déclare localement pour éviter toute erreur d'import/nom introuvable
const ACCEPT =
  "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Props = {
  attachments: Attachment[];
  onFiles: (files: FileList | null) => void;
  onRemove: (id: string) => void;
};

export default function Attachments({ attachments, onFiles, onRemove }: Props) {
  const id = "file-" + Math.random().toString(36).slice(2);

  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-skin-muted">Pièces jointes</label>

        <label
          htmlFor={id}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
          Joindre
        </label>

        <input
          id={id}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        className="mt-2 rounded-xl border-2 border-dashed border-skin-border/40 p-4 text-xs text-skin-muted text-center"
      >
        Glissez-déposez des fichiers ici
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {attachments.map((a) => (
            <div key={a.id} className="rounded-xl ring-1 ring-skin-border/20 overflow-hidden relative">
              <button
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                title="Retirer"
                aria-label="Retirer"
                onClick={() => onRemove(a.id)}
              >
                <XCircle className="w-4 h-4" />
              </button>

              {a.kind === "image" ? (
                <img src={a.url} alt={a.file.name} className="w-full h-24 sm:h-28 object-cover" />
              ) : (
                <div className="h-24 sm:h-28 grid place-items-center text-xs text-skin-muted px-2 text-center break-all">
                  {a.file.name}
                </div>
              )}

              <div className="px-2 py-1 text-[11px] truncate">{a.file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}