// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\components\communaute\CategorySelect.tsx
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { CommunityTradingCategory } from "../../types";
import {
  CATEGORY_GROUPS,
  type CategoryGroup,
  type CategoryItem,
} from "./CategoryOptions";

export default function CategorySelect({
  value,
  onChange,
}: {
  value: CommunityTradingCategory;
  onChange: (v: CommunityTradingCategory) => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLabel =
    CATEGORY_GROUPS.flatMap((g: CategoryGroup) => g.items).find(
      (i: CategoryItem) => i.value === value
    )?.label ?? "Choisir…";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-slate-900/40 px-3 py-2 text-left text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-300/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLabel}
        <span className="float-right opacity-60">▾</span>
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 max-h-72 overflow-auto"
          role="listbox"
        >
          {CATEGORY_GROUPS.map((g: CategoryGroup) => (
            <div key={g.label} className="py-1">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {g.label}
              </div>
              {g.items.map((it: CategoryItem) => {
                const selected = it.value === value;
                return (
                  <button
                    key={it.value}
                    type="button"
                    onClick={() => {
                      onChange(it.value);
                      setOpen(false);
                    }}
                    role="option"
                    aria-selected={selected}
                    className="group flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-violet-500/10 dark:hover:bg-violet-500/15"
                  >
                    <span
                      className={`shrink-0 ${
                        selected ? "opacity-100" : "opacity-0"
                      } transition-opacity`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{it.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
