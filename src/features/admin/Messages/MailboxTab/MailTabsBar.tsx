// src/pages/admin/Messages/mailbox/MailTabsBar.tsx
import { useEffect, useRef } from "react";
import { FOLDER_DEFS } from "./constants";
import type { Folder } from "./types";

type Props = {
  value: Folder;
  onChange: (f: Folder) => void;
};

export default function MailTabsBar({ value, onChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // centre l’onglet actif
  useEffect(() => {
    const el = document.getElementById(`mailtab-${value}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  // scroll horizontal au wheel
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="overflow-x-auto scroll-smooth rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface"
      aria-label="Dossiers"
    >
      <div role="tablist" className="flex gap-2 min-w-max p-2">
        {FOLDER_DEFS.map(({ key, label, Icon }) => {
          const active = key === value;
          return (
            <button
              key={key}
              id={`mailtab-${key}`}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={[
                "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap",
                active ? "bg-[#7c3aed] text-white shadow" : "hover:bg-skin-tile text-skin-base",
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}