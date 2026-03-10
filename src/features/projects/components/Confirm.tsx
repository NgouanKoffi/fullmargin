// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\projets\composants\Confirm.tsx
import Modal from "./Modal";

export default function Confirm({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <Modal ouvert={open} titre={title} onClose={onCancel}>
      <p className="mb-4 opacity-80">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="rounded-xl px-4 py-2 bg-rose-600 text-white hover:opacity-90"
        >
          Confirmer
        </button>
      </div>
    </Modal>
  );
}
