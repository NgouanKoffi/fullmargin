// src/pages/communaute/public/components/SearchBar.tsx
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Props = {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  /** Appelé quand on veut filtrer (au submit OU en live) */
  onSearch?: (q: string) => void;
  /** Activer la recherche en live (avec délai) */
  live?: boolean; // default: true
  /** Délai (ms) avant d’émettre onSearch en live */
  debounceMs?: number; // default: 250
  /** Callback optionnel quand on efface le champ */
  onClear?: () => void;
  /** Auto focus sur l’input */
  autoFocus?: boolean;
};

export default function SearchBar({
  placeholder = "Rechercher…",
  className = "",
  defaultValue = "",
  onSearch,
  live = true,
  debounceMs = 250,
  onClear,
  autoFocus,
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const timer = useRef<number | null>(null);
  const initialized = useRef(false);

  // Si defaultValue change (ex: navigation), on le reflète dans l'input
  useEffect(() => {
    setQ(defaultValue || "");
  }, [defaultValue]);

  // Recherche en live (debounce)
  useEffect(() => {
    // éviter d’émettre dès le 1er rendu si defaultValue est présent
    if (!initialized.current) {
      initialized.current = true;
      if (live && (defaultValue ?? "") !== "") {
        // on peut émettre une 1ère fois pour synchroniser la vue
        onSearch?.((defaultValue || "").trim());
      }
      return;
    }

    if (!live) return;

    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    timer.current = window.setTimeout(() => {
      onSearch?.(q.trim());
    }, Math.max(0, debounceMs));

    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [q, live, debounceMs, onSearch, defaultValue]);

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    onSearch?.(q.trim());
  };

  const clear = () => {
    setQ("");
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    onSearch?.("");
    onClear?.();
  };

  return (
    <form onSubmit={submit} className={`relative ${className}`} role="search">
      <span
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
      >
        <Search className="w-4 h-4" />
      </span>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-xl pl-9 pr-9 py-2.5 text-sm
          bg-white/80 dark:bg-white/10
          ring-1 ring-black/5 dark:ring-white/10
          placeholder:text-slate-500 dark:placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-violet-600
          transition-shadow
        "
        aria-label="Rechercher"
        autoFocus={autoFocus}
      />

      {q && (
        <button
          type="button"
          onClick={clear}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            inline-flex items-center justify-center w-7 h-7
            rounded-full hover:bg-black/5 dark:hover:bg-white/10
          "
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}
