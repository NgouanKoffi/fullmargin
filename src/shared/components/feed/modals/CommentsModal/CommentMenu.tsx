// src/pages/communaute/public/components/feed/modals/comments/CommentMenu.tsx
import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

export default function CommentMenu({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!canEdit && !canDelete) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Options du commentaire"
      >
        <EllipsisVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 shadow-xl"
        >
          {canEdit && (
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full px-3 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10 inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
