import { useEffect } from "react";
import type { PropsWithChildren } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
}>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        className={`absolute inset-x-4 top-6 mx-auto ${maxWidth} rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 shadow-xl flex flex-col`}
        role="dialog"
        aria-modal="true"
        // Taille/scroll interne du modal
        style={{ maxHeight: "85vh" }} // limite la hauteur du modal
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Fermer
          </button>
        </div>

        {/* Body scrollable */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
