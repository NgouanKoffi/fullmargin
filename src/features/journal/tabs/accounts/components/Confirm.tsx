import Dialog from "./Dialog";

export default function Confirm({
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
    <Dialog open={open} onClose={onCancel} title={title}>
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
    </Dialog>
  );
}
