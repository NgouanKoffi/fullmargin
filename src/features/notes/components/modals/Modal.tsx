import { X } from "lucide-react";
import React from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  width = "max-w-md",
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  width?: string; // tailwind class
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={`absolute left-1/2 top-10 -translate-x-1/2 ${width} w-[92vw] sm:w-auto rounded-2xl border border-white/10 bg-slate-900 text-slate-100 shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <div className="px-4 pb-4 pt-2 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
