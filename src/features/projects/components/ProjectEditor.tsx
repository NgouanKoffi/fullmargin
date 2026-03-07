// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\projets\composants\ProjectEditor.tsx
import React, { useEffect, useState } from "react";

export default function ProjectEditor({
  open,
  title,
  confirmLabel,
  initialName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState<string>(initialName ?? "");

  // ⬅️ Sync the input every time the modal (re)opens or the initialName changes
  useEffect(() => {
    if (open) setName(initialName ?? "");
  }, [open, initialName]);

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    onSubmit((name || "").trim());
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-xl border border-black/10 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>

        <form className="mt-4 space-y-3" onSubmit={handleConfirm}>
          <label htmlFor="proj-name" className="text-sm opacity-80">
            Nom du projet
          </label>
          <input
            id="proj-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon projet"
            className="w-full rounded-xl bg-white dark:bg-neutral-900 border border-black/15 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/40"
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-95"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
