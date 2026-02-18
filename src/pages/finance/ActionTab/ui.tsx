// src/pages/finance/ActionTab/ui.tsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
      {help && (
        <span className="mt-1 flex items-center gap-1 text-[12px] text-slate-500">
          <Info className="w-3.5 h-3.5" /> {help}
        </span>
      )}
    </label>
  );
}

/**
 * EXACTEMENT comme dans AccountTab :
 * - rendu dans <body> (portal)
 * - overlay qui scrolle
 * - padding-top pour ne pas passer sous ta barre
 * - pas d’overflow hidden qui coupe les rings
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();

    // on bloque le scroll global, comme dans AccountTab
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    document.addEventListener("keydown", onKey);

    // focus auto
    setTimeout(() => {
      boxRef.current
        ?.querySelector<HTMLElement>("input,select,textarea,button")
        ?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] overflow-y-auto bg-black/40
                 [overscroll-behavior:contain] [touch-action:pan-y]
                 [scrollbar-width:thin]
                 [scrollbar-color:rgba(148,163,184,.6)_rgba(2,6,23,.25)]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="min-h-full flex items-start justify-center
                   p-4 sm:p-6
                   pt-[max(4.5rem,env(safe-area-inset-top))]  /* ↓↓↓ pour passer sous ta barre */
                   pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={boxRef}
          className="w-[95vw] max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 shadow-xl flex flex-col"
        >
          <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm border hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function Confirm({
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
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="h-10 rounded-lg px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="h-10 rounded-lg px-4 bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500"
        >
          Supprimer
        </button>
      </div>
    </Modal>
  );
}
