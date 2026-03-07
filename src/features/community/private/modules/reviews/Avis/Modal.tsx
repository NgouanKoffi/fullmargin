// src/pages/communaute/private/community-details/components/Modal.tsx
import React, { useEffect, useMemo } from "react";
import ReactDOM from "react-dom";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  // 1. on détermine si on est dans le browser
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  // 2. on mémorise la cible du portal (toujours au même endroit)
  const portalTarget = useMemo(() => {
    if (!isBrowser) return null;
    return document.body;
  }, [isBrowser]);

  // 3. on bloque le scroll UNIQUEMENT quand le modal est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // si pas ouvert ou pas de cible (SSR), on ne rend rien
  if (!open || !portalTarget) {
    return null;
  }

  // 4. rendu dans un portal
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full sm:max-w-xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 p-5 m-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-sm opacity-70 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    portalTarget
  );
}
