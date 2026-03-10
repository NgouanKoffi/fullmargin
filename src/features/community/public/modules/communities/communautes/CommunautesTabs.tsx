// src/pages/communaute/public/sections/communautes/CommunautesTabs.tsx
import type { SubTab } from "./Communautes.hooks";

type Props = {
  active: SubTab;
  onChange: (t: SubTab) => void;
};

export function CommunautesTabs({ active, onChange }: Props) {
  const base =
    "relative px-2 pb-2 text-sm font-medium transition sm:px-3 whitespace-nowrap flex-none";
  const inactive =
    "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100";
  const activeCls = "text-violet-600 dark:text-violet-300";

  return (
    <div className="mt-6 border-b border-slate-200 dark:border-slate-700">
      {/* flex-nowrap + overflow-x-auto : une seule ligne, scroll si ça dépasse */}
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => onChange("mine")}
          className={`${base} ${active === "mine" ? activeCls : inactive}`}
        >
          Mes communautés
          {active === "mine" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange("top")}
          className={`${base} ${active === "top" ? activeCls : inactive}`}
        >
          Top communautés
          {active === "top" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange("all")}
          className={`${base} ${active === "all" ? activeCls : inactive}`}
        >
          Toutes les communautés
          {active === "all" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
          )}
        </button>
      </div>
    </div>
  );
}
