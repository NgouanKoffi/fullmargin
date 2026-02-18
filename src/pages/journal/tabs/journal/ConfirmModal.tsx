export default function ConfirmModal({
    open, title, message, onCancel, onConfirm
  }:{
    open: boolean; title: string; message: string;
    onCancel: () => void; onConfirm: () => void;
  }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-3">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
            {message}
          </div>
          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="h-10 px-4 rounded-lg bg-rose-600 text-white font-semibold"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }  