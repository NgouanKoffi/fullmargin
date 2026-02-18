// src/pages/communaute/private/community-details/tabs/Publications/TabsHeader.tsx
import { cx } from "./helpers";
import type { TabKey } from "./types";

// on élargit TabKey côté types.ts pour ajouter "deleted"

export function TabsHeader({
  active,
  setActive,
  showSubscribersTab = true,
  showDeletedTab = true,
}: {
  active: TabKey;
  setActive: (k: TabKey) => void;
  showSubscribersTab?: boolean;
  showDeletedTab?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto">
      <button
        onClick={() => setActive("feed")}
        type="button"
        className={cx(
          "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
          active === "feed"
            ? "bg-violet-600 text-white shadow"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
        )}
      >
        Publications
      </button>

      <button
        onClick={() => setActive("mine")}
        type="button"
        className={cx(
          "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
          active === "mine"
            ? "bg-violet-600 text-white shadow"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
        )}
      >
        Mes publications
      </button>

      {showSubscribersTab ? (
        <button
          onClick={() => setActive("subs")}
          type="button"
          className={cx(
            "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
            active === "subs"
              ? "bg-violet-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
          )}
        >
          Publications d’abonnés
        </button>
      ) : null}

      {showDeletedTab ? (
        <button
          onClick={() => setActive("deleted")}
          type="button"
          className={cx(
            "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
            active === "deleted"
              ? "bg-rose-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
          )}
        >
          Publications supprimées
        </button>
      ) : null}
    </div>
  );
}
