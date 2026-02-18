function StatPill({ value, label }: { value: number; label: string }) {
    return (
      <div className="rounded-2xl ring-1 ring-skin-border/30 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-center">
        <div className="text-xl font-bold text-skin-base">{value}</div>
        <div className="text-xs text-skin-muted mt-0.5">{label}</div>
      </div>
    );
  }
  
  export default function StatsCard({ posts = 0, likes = 0, followers = 0 }: { posts?: number; likes?: number; followers?: number }) {
    return (
      <div className="rounded-3xl border border-skin-border/60 ring-1 ring-skin-border/30 bg-white dark:bg-slate-900 p-4 shadow-xl">
        <h3 className="font-semibold text-skin-base">Statistiques</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatPill value={posts} label="Posts" />
          <StatPill value={likes} label="J’aime" />
          <StatPill value={followers} label="Abonnés" />
        </div>
      </div>
    );
  }
  