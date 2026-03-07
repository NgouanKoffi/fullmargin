// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\promo\AsyncSearchSelect.tsx
import { useEffect, useRef, useState } from "react";

export type SelectOption<V extends string = string> = {
  value: V;
  label: string;
  /** Ligne secondaire (ex: “2 produits publiés”). Toujours une string. */
  meta?: string;
};

export type AsyncSearchSelectProps<T> = {
  /** Retourne des items de domaine (T) pour une requête q */
  fetcher: (q: string) => Promise<T[]>;
  /** Transforme un item de domaine en option affichable */
  toOption: (item: T) => SelectOption<string>;
  /** Valeur contrôlée */
  value: SelectOption<string> | null;
  /** Setter contrôlé */
  onChange: (opt: SelectOption<string> | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function AsyncSearchSelect<T>({
  fetcher,
  toOption,
  value,
  onChange,
  placeholder = "Rechercher…",
  disabled = false,
}: AsyncSearchSelectProps<T>) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<SelectOption<string>[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounced(q, 250);

  useEffect(() => {
    if (disabled) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await fetcher(debouncedQ);
        if (!cancelled) setOptions(items.map(toOption));
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, fetcher, toOption, disabled]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value ? value.label : q}
        onChange={(e) => {
          onChange(null);
          setQ(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 w-full rounded-xl px-3 text-sm bg-white dark:bg-neutral-950
                   ring-1 ring-black/10 dark:ring-white/10 outline-none
                   focus:ring-2 focus:ring-rose-500/60 disabled:opacity-60"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5
                     rounded-md ring-1 ring-black/10 dark:ring-white/10
                     hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Effacer
        </button>
      )}

      {open && !disabled && (
        <div
          className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-xl
                     bg-white dark:bg-neutral-950 ring-1 ring-black/10 dark:ring-white/10 shadow-lg"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm opacity-70">Chargement…</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm opacity-70">Aucun résultat</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div className="font-medium">{opt.label}</div>
                {opt.meta ? (
                  <div className="text-[11px] opacity-60">{opt.meta}</div>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
