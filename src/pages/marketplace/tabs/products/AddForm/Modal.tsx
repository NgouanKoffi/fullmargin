import React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: Props) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[560px] max-w-[90vw] rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? (
          <div className="px-4 py-3 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
