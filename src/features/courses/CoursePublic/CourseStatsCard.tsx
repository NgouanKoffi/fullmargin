// src/pages/course/course-public/CourseStatsCard.tsx
import { Layers, Clock3 } from "lucide-react";

type StatsProps = {
  modulesCount: number;
  lessonsCount: number;
};

export function CourseStatsCard({ modulesCount, lessonsCount }: StatsProps) {
  return (
    <div className="w-full rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-4 bg-white/80 dark:bg-slate-900/70 text-sm space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-indigo-500" />
        <span>
          <span className="font-semibold">{modulesCount}</span> modules •{" "}
          <span className="font-semibold">{lessonsCount}</span> leçons
        </span>
      </div>
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <Clock3 className="h-4 w-4 text-emerald-500" />
        <span>
          Progresser à ton rythme, accès 24h/24 depuis ton espace FullMargin.
        </span>
      </div>
    </div>
  );
}
