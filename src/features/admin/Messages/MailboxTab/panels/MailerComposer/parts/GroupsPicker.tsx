import { useEffect, useRef, useState } from "react";
import type { GroupOption } from "../types";
import { X, ChevronDown } from "lucide-react";

type Props = {
  groupIds: string[];
  setGroupIds: (next: string[]) => void;
  groupsOptions: GroupOption[];
};

export default function GroupsPicker({ groupIds, setGroupIds, groupsOptions }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Fermer au clic dehors
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle(id: string) {
    setGroupIds(
      groupIds.includes(id) ? groupIds.filter((x) => x !== id) : [...groupIds, id]
    );
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3" ref={wrapRef}>
      <label className="text-xs font-medium text-skin-muted">Groupes de diffusion</label>

      <div className="mt-1">
        {/* ⚠️ PAS un <button> ici → <div role="button"> pour éviter <button> imbriqués */}
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKey}
          className="w-full text-start rounded-xl border border-skin-border/30 bg-transparent px-3 py-2 flex items-center gap-2 cursor-pointer"
          dir="auto"
        >
          <div className="flex-1 min-w-0 flex flex-wrap gap-1">
            {groupIds.length === 0 ? (
              <span className="text-skin-muted">Sélectionner des groupes…</span>
            ) : (
              groupIds.map((id) => {
                const g = groupsOptions.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs bg-skin-tile"
                  >
                    {g?.name || id}
                    {/* Ceci est un vrai bouton, mais il n’est plus À L’INTÉRIEUR d’un <button> */}
                    <button
                      type="button"
                      className="opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(id);
                      }}
                      aria-label="Retirer"
                      title="Retirer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
        </div>

        {open && (
          <div
            role="listbox"
            className="mt-2 rounded-xl border border-skin-border/30 bg-skin-surface p-2 max-h-56 overflow-auto"
          >
            {groupsOptions.map((g) => {
              const checked = groupIds.includes(g.id);
              return (
                <label
                  key={g.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-skin-tile cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(g.id)}
                  />
                  <span className="text-sm">{g.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}