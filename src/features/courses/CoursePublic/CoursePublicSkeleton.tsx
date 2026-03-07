// src/pages/course/course-public/CoursePublicSkeleton.tsx
export function CoursePublicSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-10 2xl:px-16 py-6 overflow-x-hidden">
      <div className="animate-pulse space-y-4">
        <div className="h-44 sm:h-56 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40" />
        <div className="h-6 w-2/3 rounded bg-slate-200/60 dark:bg-slate-800/40" />
        <div className="h-4 w-1/2 rounded bg-slate-200/60 dark:bg-slate-800/40" />
      </div>
    </section>
  );
}
