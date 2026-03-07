// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\ui\DeleteConfirmModal.tsx
import { useEffect } from "react";

type DeleteConfirmModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  title = "Confirmer la suppression",
  message = "Cette action est irréversible. Souhaitez-vous continuer ?",
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 text-white rounded-xl shadow-lg p-6 w-full max-w-md border border-neutral-700">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-neutral-400 mb-5">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 transition font-semibold"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
