import React, { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Bloque le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Par défaut (mobile) : occupe 100% de l'écran, sans arrondi/ombre/marge */}
      {/* À partir de sm : carte centrée classique */}
      <div className="
        absolute inset-0 flex h-full w-full flex-col overflow-hidden
        bg-white dark:bg-neutral-900
        sm:static sm:mx-auto sm:mt-[7vh] sm:h-auto sm:max-h-[86vh] sm:w-full sm:max-w-[min(90vw,1200px)]
        sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-black/10 sm:dark:ring-white/10
      ">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 text-base font-semibold dark:border-white/10 dark:bg-neutral-900 sm:px-6 sm:py-4 sm:text-lg">
          <h3 className="truncate">{title}</h3>
          <button
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Fermer"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {/* Footer sticky bas */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900 sm:px-6 sm:py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}