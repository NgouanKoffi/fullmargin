// src/pages/communaute/private/community-details/tabs/GroupesTab.tsx
type Props = {
  communityId: string;
  isOwner: boolean;
  isMember: boolean;
  isAuthenticated: boolean;
};

export default function GroupesTab({
  communityId,
  isOwner,
  isMember,
  isAuthenticated,
}: Props) {
  const canCreate = isOwner;
  const canSeeList = isMember || isOwner;

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-white/90 p-6">
        Connecte-toi pour voir et rejoindre les groupes de cette communauté.
      </div>
    );
  }

  if (!canSeeList) {
    return (
      <div className="rounded-2xl bg-white/90 p-6">
        Deviens membre de cette communauté pour accéder aux groupes.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 p-6 border border-slate-100/60 dark:border-slate-800/60">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Groupes de la communauté</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organise les membres en petits groupes thématiques ou privés.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition"
          >
            <span className="text-base leading-none">＋</span>
            Nouveau groupe
          </button>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">Ici tu pourras bientôt&nbsp;:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Créer des groupes privés ou publics.</li>
          <li>Gérer les membres de chaque groupe.</li>
          <li>Lier des discussions, ressources ou formations à un groupe.</li>
        </ul>

        <p className="mt-3 text-xs text-slate-400">
          ID communauté : <code className="font-mono">{communityId}</code>
        </p>
      </div>
    </div>
  );
}
