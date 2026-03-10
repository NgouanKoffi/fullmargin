// src/pages/communaute/private/community-details/tabs/CommunityProfil/owner/OwnerAdminView.tsx
import type { OwnerView, CommunityStatsDTO } from "./OwnerTab";

export default function OwnerAdminView({
  stats,
  statsLoading,
  statsErr,
}: {
  owner: OwnerView;
  stats: CommunityStatsDTO["data"] | null;
  statsLoading: boolean;
  statsErr: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 p-6 space-y-6">
      {/* header simple */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Tableau de bord communauté
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {stats?.name ? stats.name : "Communauté"}
        </p>
      </div>

      {/* état */}
      {statsLoading && (
        <div className="text-sm text-slate-500">Chargement des stats…</div>
      )}
      {statsErr && <div className="text-sm text-red-500">{statsErr}</div>}

      {/* cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Membres" value={stats?.counts?.subscribers ?? 0} />
        <StatCard title="Posts" value={stats?.counts?.posts ?? 0} />
        <StatCard title="Commentaires" value={stats?.counts?.comments ?? 0} />
        <StatCard title="Avis" value={stats?.counts?.reviews ?? 0} />
        <StatCard
          title="Note moyenne"
          value={
            stats?.ratings?.average != null
              ? stats.ratings.average.toFixed(1)
              : "—"
          }
          sub={
            stats?.ratings?.totalReviews
              ? `${stats.ratings.totalReviews} avis`
              : ""
          }
        />
        <StatCard title="Likes" value={stats?.counts?.likes ?? 0} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {title}
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
      {sub ? <div className="text-xs text-slate-400 mt-1">{sub}</div> : null}
    </div>
  );
}
