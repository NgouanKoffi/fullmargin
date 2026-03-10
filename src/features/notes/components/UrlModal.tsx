import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

function isProbablyURL(s: string): boolean {
  if (!s) return false;
  const v = s.trim();
  // Autorise http(s), data:, mailto:, tel:, ou un chemin absolu relatif "/..."
  return /^(https?:\/\/|data:|mailto:|tel:|\/)/i.test(v);
}

export default function UrlModal({
  open,
  title,
  placeholder,
  initial = "",
  confirmLabel = "Insérer",
  onCancel,
  onSubmit,
}: {
  open: boolean;
  title: string;
  placeholder: string;
  initial?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onSubmit: (url: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const valid = useMemo(() => isProbablyURL(value), [value]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && valid) onSubmit(value.trim());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, valid, value, onCancel, onSubmit]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[92vw] max-w-md rounded-2xl border border-black/10 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-black/5"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg bg-white border border-black/15 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30"
          />
          {!valid && value.trim().length > 0 && (
            <p className="text-[12px] text-red-600">
              Lien invalide. Utilise une URL commençant par http(s)://, data:,
              mailto:, tel:, ou un chemin /…
            </p>
          )}
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-black/10 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-black/5 hover:bg-black/10"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-40"
            onClick={() => onSubmit(value.trim())}
            disabled={!valid}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
