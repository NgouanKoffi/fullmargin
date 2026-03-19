// src/pages/admin/Messages/MailboxTab/components/MailSearchDialog.tsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

type Props = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
};

export default function MailSearchDialog({ open, value, onChange, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[70] grid place-items-start sm:place-items-center p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface shadow-2xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted" />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Rechercher dans les messages (expéditeur, sujet, extrait)"
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-skin-border/30 bg-transparent text-base"
            />
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 hover:bg-skin-tile ring-1 ring-skin-border/20"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-1 pt-2 text-xs text-skin-muted">
          Appuyez sur <kbd className="px-1 py-0.5 rounded bg-skin-tile">Échap</kbd> pour fermer.
        </div>
      </div>
    </div>,
    document.body
  );
}