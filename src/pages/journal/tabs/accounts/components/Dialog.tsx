// src/pages/journal/tabs/accounts/components/Dialog.tsx
import React from "react";
import { X } from "lucide-react";

export default function Dialog({
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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/55 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* le panel */}
      <div
        className="w-full h-full max-w-4xl sm:h-auto sm:max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 shadow-2xl sm:rounded-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 z-10">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
