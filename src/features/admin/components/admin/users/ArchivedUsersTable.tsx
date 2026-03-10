export type ArchivedUserRow = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  archivedAt?: string;
  reason?: string;
};

export default function ArchivedUsersTable({
  rows,
  loading,
  onRestore,
  restoringId,
}: {
  rows: ArchivedUserRow[];
  loading: boolean;
  onRestore: (id: string) => void;
  restoringId?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/60 backdrop-blur z-10">
            <tr className="text-left text-xs text-slate-600 dark:text-slate-300">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Archivé le</th>
              <th className="px-4 py-3">Motif</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={5}
                >
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-slate-500"
                  colSpan={5}
                >
                  Aucun compte désactivé.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isRestoring = restoringId === u.id;
                return (
                  <tr
                    key={u.id}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl || "/images/avatar-fallback.png"}
                          className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                          alt=""
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {u.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Désactivé
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="block truncate max-w-[220px]">
                        {u.email}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {u.archivedAt
                        ? new Date(u.archivedAt).toLocaleString("fr-FR")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 max-w-[260px]">
                      <span className="block truncate" title={u.reason || ""}>
                        {u.reason || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onRestore(u.id)}
                        disabled={isRestoring}
                        className={[
                          "px-2 py-1.5 text-xs rounded-lg text-white",
                          isRestoring
                            ? "bg-emerald-400 cursor-wait"
                            : "bg-emerald-600 hover:bg-emerald-700",
                        ].join(" ")}
                        title="Réactiver le compte"
                      >
                        {isRestoring ? "Restauration…" : "Réactiver"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
