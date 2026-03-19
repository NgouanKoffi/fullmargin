import { useState } from "react";
import Modal from "./Modal";
import { Trash2, FolderX } from "lucide-react";

export default function DeleteFolderConfirmModal({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (deleteNotes: boolean) => void;
}) {
  const [deleteNotes, setDeleteNotes] = useState(false);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-sm font-semibold transition"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-red-500/20"
            onClick={() => onConfirm(deleteNotes)}
          >
            <Trash2 className="w-4 h-4" />
            Confirmer la suppression
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Que souhaitez-vous faire des notes contenues dans ce dossier ?
        </p>

        <div className="grid gap-3">
          <label
            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition cursor-pointer group ${
              !deleteNotes
                ? "border-violet-600 bg-violet-50 dark:bg-violet-500/10"
                : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              className="mt-1 accent-violet-600 cursor-pointer"
              checked={!deleteNotes}
              onChange={() => setDeleteNotes(false)}
            />
            <div className="flex-1">
              <div
                className={`flex items-center gap-2 font-semibold text-sm ${
                  !deleteNotes
                    ? "text-violet-900 dark:text-violet-100"
                    : "text-slate-700 dark:text-white"
                }`}
              >
                <FolderX
                  className={`w-4 h-4 ${
                    !deleteNotes
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                Supprimer uniquement le dossier
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  !deleteNotes
                    ? "text-violet-700 dark:text-violet-200/70"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Les dossiers et sous-dossiers seront supprimés. Les notes seront
                conservées et déplacées à la racine.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition cursor-pointer group ${
              deleteNotes
                ? "border-red-600 bg-red-50 dark:bg-red-500/10"
                : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              className="mt-1 accent-red-600 cursor-pointer"
              checked={deleteNotes}
              onChange={() => setDeleteNotes(true)}
            />
            <div className="flex-1">
              <div
                className={`flex items-center gap-2 font-semibold text-sm ${
                  deleteNotes
                    ? "text-red-900 dark:text-red-100"
                    : "text-slate-700 dark:text-white"
                }`}
              >
                <Trash2
                  className={`w-4 h-4 ${
                    deleteNotes
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                Tout supprimer (Dossier + Notes)
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  deleteNotes
                    ? "text-red-700 dark:text-red-200/70"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Le dossier, tous ses sous-dossiers et TOUTES les notes qu'ils
                contiennent seront supprimés définitivement.
              </p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
