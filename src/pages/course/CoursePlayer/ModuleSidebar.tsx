// src/pages/communaute/private/community-details/tabs/Formations/CoursePlayer/ModuleSidebar.tsx
import type { ModuleT } from "./coursePlayerTypes";

type ModuleSidebarProps = {
  modules: ModuleT[];
  selectedModuleIndex: number;
  onSelectModule: (index: number) => void;
  onShowReviews: () => void;
};

export function ModuleSidebar({
  modules,
  selectedModuleIndex,
  onSelectModule,
  onShowReviews,
}: ModuleSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-slate-50/90 dark:bg-slate-950/70 p-4">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Programme
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
            Modules du cours
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {modules.length === 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Aucun module défini pour ce cours.
            </div>
          )}

          {modules.map((m, mi) => {
            const lessonsCount = m.lessons?.length ?? 0;
            const isActive = selectedModuleIndex === mi;

            return (
              <button
                key={m.id || mi}
                type="button"
                onClick={() => onSelectModule(mi)}
                className={`w-full rounded-xl border px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  isActive
                    ? "border-slate-400 bg-white dark:border-slate-500 dark:bg-slate-900"
                    : "border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span className="font-semibold text-[13px] text-slate-900 dark:text-slate-50 truncate">
                  {m.title || `Module ${mi + 1}`}
                </span>
                <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {lessonsCount} leçon{lessonsCount > 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onShowReviews}
          className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-2 text-xs font-semibold shadow-sm hover:opacity-90 transition"
        >
          Laisser un avis
        </button>
      </div>
    </div>
  );
}
