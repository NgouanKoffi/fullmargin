import React, { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmer",
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Échap/Entrée + focus trap minimal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        // éviter de déclencher depuis un input multiline
        const t = e.target as HTMLElement | null;
        const tag = (t?.tagName || "").toLowerCase();
        if (tag !== "textarea") {
          e.preventDefault();
          onConfirm();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    // focus le panneau pour la navigation clavier
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onCancel}
      />

      {/* Panneau */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative z-[1] w-[92%] max-w-md rounded-2xl shadow-xl",
          // surfaces + bordures
          "bg-white dark:bg-slate-900",
          "border border-black/15 dark:border-white/10",
          "ring-1 ring-black/5 dark:ring-white/5",
          // textes
          "text-slate-900 dark:text-slate-100",
          // padding
          "p-5",
        ].join(" ")}
      >
        <h3 id="confirm-title" className="text-base font-semibold mb-1">
          {title}
        </h3>

        {children && (
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {children}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={[
              "px-3 py-1.5 text-sm rounded-xl",
              // bouton secondaire
              "bg-white/80 dark:bg-slate-800",
              "border border-black/20 dark:border-white/10",
              "text-slate-700 dark:text-slate-200",
              "hover:bg-black/5 dark:hover:bg-white/10",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500/50",
              "transition-colors",
            ].join(" ")}
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            className={[
              "px-3 py-1.5 text-sm rounded-xl",
              "bg-red-600 text-white hover:brightness-95",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500/60",
              "transition-colors",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
