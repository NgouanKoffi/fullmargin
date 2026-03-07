import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  text,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onCancel}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-slate-700 dark:text-slate-300">{text}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="h-9 px-3 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
