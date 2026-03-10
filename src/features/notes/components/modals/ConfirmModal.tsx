import Modal from "./Modal";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  tone = "danger",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className={`px-3 py-2 rounded-lg ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm opacity-90">{message}</p>
    </Modal>
  );
}
