import { EllipsisVertical, Folder } from "lucide-react";
import { useState } from "react";

export default function FolderCard({
  id,
  name,
  accent,
  onOpen,
  onRename,
  onCreateSub,
  onDelete,
  onDropNote,
}: {
  id: string;
  name: string;
  accent: string;
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onCreateSub: (id: string) => void;
  onDelete: (id: string) => void;
  onDropNote: (noteId: string, folderId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("text/plain");
    if (noteId) onDropNote(noteId, id);
  };

  return (
    <div className="relative min-w-0">
      <article
        className="relative group rounded-2xl border border-black/15 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm overflow-hidden hover:shadow-md transition"
        onDragOver={onDragOver}
        onDrop={onDrop}
        title={name}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
        <button
          onClick={() => onOpen(id)}
          className="w-full text-left p-4 flex flex-col gap-3 min-h-[120px]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-3">
              <span className="inline-grid place-items-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-black/15 dark:border-white/10">
                <Folder className="w-5 h-5 opacity-70" />
              </span>
              <span className="truncate text-[15px] font-semibold">{name}</span>
            </div>
          </div>
        </button>

        <button
          className="absolute top-2 right-2 p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          title="Options"
        >
          <EllipsisVertical className="w-4 h-4" />
        </button>
      </article>

      {menuOpen && (
        <div className="absolute z-50 right-3 top-10 rounded-lg border border-black/15 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg overflow-auto max-h-[70vh] text-sm">
          <button
            className="block w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              setMenuOpen(false);
              onRename(id);
            }}
          >
            Renommer
          </button>
          <button
            className="block w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              setMenuOpen(false);
              onCreateSub(id);
            }}
          >
            Nouveau sous-dossier
          </button>
          <button
            className="block w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10"
            onClick={() => {
              setMenuOpen(false);
              onDelete(id);
            }}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
