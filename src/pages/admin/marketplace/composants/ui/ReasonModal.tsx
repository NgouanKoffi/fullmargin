// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\ui\ReasonModal.tsx
import { useState, useEffect } from "react";

export default function ReasonModal({
  open,
  title,
  actionLabel = "Confirmer",
  placeholder = "Motif…",
  busy = false,
  minLength = 3,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  title: string;
  actionLabel?: string;
  placeholder?: string;
  busy?: boolean;
  minLength?: number;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const canSubmit = !busy && reason.trim().length >= minLength;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 shadow-xl">
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder={placeholder}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="p-4 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => canSubmit && onSubmit(reason.trim())}
            disabled={!canSubmit}
            className="rounded-lg px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Envoi…" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
