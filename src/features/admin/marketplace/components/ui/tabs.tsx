// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\ui\tabs.tsx
import { useState } from "react";
import type { ReactNode } from "react";

export type TabItem = { key: string; label: string; content: ReactNode };

export default function Tabs({
  items,
  defaultKey,
  onChange,
}: {
  items: TabItem[];
  defaultKey?: string;
  onChange?: (k: string) => void;
}) {
  const [active, setActive] = useState<string>(defaultKey ?? items[0]?.key);

  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-black/10 dark:border-white/10 mb-3 overflow-x-auto">
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              type="button"
              className={[
                "whitespace-nowrap rounded-t-xl px-3 py-2 text-sm font-medium",
                "ring-1 ring-black/10 dark:ring-white/10",
                isActive
                  ? "bg-violet-600 text-white"
                  : "bg-white/70 dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800",
              ].join(" ")}
              onClick={() => {
                setActive(it.key);
                onChange?.(it.key);
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2">{items.find((i) => i.key === active)?.content}</div>
    </div>
  );
}
