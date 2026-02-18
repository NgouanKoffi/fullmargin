// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\components\ui\SearchModal.tsx
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Appelé quand l'utilisateur valide la recherche (submit) */
  onSubmit: (q: string) => void;
};

export default function SearchModal({ open, onClose, onSubmit }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const value = q.trim();
    onSubmit(value);
    onClose(); // 👉 on ferme le modal uniquement quand on valide vraiment
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="w-full"
        >
          <div
            className="
              flex items-center w-full rounded-2xl overflow-hidden
              bg-neutral-100/70 dark:bg-neutral-800/70
              ring-1 ring-black/10 dark:ring-white/10
              focus-within:ring-2 focus-within:ring-violet-500
              px-3
            "
          >
            {/* loupe */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0 text-neutral-600 dark:text-neutral-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m21 21-4.35-4.35" />
              <circle cx="10" cy="10" r="7" />
            </svg>

            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
              }}
              placeholder="Rechercher…"
              type="text" // ✅ plus de X natif iOS
              enterKeyHint="search"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:opacity-60 px-2 py-2"
            />

            {/* Effacer (X) */}
            {q.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQ(""); // ✅ efface juste le champ local
                }}
                aria-label="Effacer la recherche"
                className="p-2 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              aria-label="Rechercher"
              className="p-2 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"
            >
              <span className="sm:hidden">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m21 21-4.35-4.35" />
                  <circle cx="10" cy="10" r="7" />
                </svg>
              </span>
              <span className="hidden sm:inline text-sm font-medium px-1">
                Rechercher
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
