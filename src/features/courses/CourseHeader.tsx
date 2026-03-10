// src/pages/communaute/public/courses/components/CourseHeader.tsx
import { CalendarClock, Layers } from "lucide-react";
import type { CourseSaved } from "./CourseTypes";

function formatRelativeFR(dateIso: string): string {
  const now = Date.now();
  const t = new Date(dateIso).getTime();
  const diff = Math.max(0, now - t);
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "à l'instant";
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.round(mo / 12);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

export function CourseHeader({
  course,
  modulesCount,
  lessonsCount,
}: {
  course: CourseSaved;
  modulesCount: number;
  lessonsCount: number;
  reviewsCount: number;
  averageRating: number;
}) {
  return (
    <div className="w-full rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-4 sm:p-6 bg-white/70 dark:bg-slate-900/60">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 break-words">
        {course.title}
      </h1>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Niveau : {course.level}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-4 w-4" /> {modulesCount} modules, {lessonsCount}{" "}
          leçons
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-4 w-4" />{" "}
          {formatRelativeFR(course.updatedAt)}
        </span>
      </div>
    </div>
  );
}
