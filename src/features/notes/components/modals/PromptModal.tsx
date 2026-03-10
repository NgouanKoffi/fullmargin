import { useEffect, useState } from "react";
import Modal from "./Modal";

export default function PromptModal({
  open,
  title,
  placeholder,
  initial = "",
  confirmLabel = "Valider",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  placeholder: string;
  initial?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial, open]);

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
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-105"
            onClick={() => onConfirm(value.trim())}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40"
      />
    </Modal>
  );
}
