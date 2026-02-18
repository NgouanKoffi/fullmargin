// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\index\Skeleton.tsx

export function CommunityDetailsSkeleton() {
  return (
    <section className="pb-10">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-pulse">
        <div className="lg:hidden h-9 mb-2">
          <div className="h-9 w-40 rounded-full bg-slate-200/70 dark:bg-slate-700/50" />
        </div>
        <div className="hidden lg:flex gap-3 mb-5">
          <div className="h-10 w-28 rounded-2xl bg-slate-200/70 dark:bg-slate-700/50" />
          <div className="h-10 w-32 rounded-2xl bg-slate-200/50 dark:bg-slate-700/30" />
          <div className="h-10 w-36 rounded-2xl bg-slate-200/40 dark:bg-slate-700/20" />
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-900/40 border border-slate-100/60 dark:border-slate-800/40 p-5 space-y-4">
          <div className="h-6 w-40 rounded bg-slate-200/80 dark:bg-slate-700/50" />
          <div className="h-4 w-3/4 rounded bg-slate-200/60 dark:bg-slate-700/30" />
          <div className="h-4 w-2/3 rounded bg-slate-200/40 dark:bg-slate-700/20" />
          <div className="h-44 w-full rounded-2xl bg-slate-200/30 dark:bg-slate-700/10" />
        </div>
      </div>
    </section>
  );
}
