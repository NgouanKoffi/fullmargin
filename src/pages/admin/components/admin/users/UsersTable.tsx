import React from "react";
import type { PresenceLite, UserRow } from "../../../userstypes";

function StatusDot({ status }: { status: PresenceLite["status"] | undefined }) {
  const color =
    status === "online"
      ? "bg-green-500"
      : status === "away"
      ? "bg-yellow-500"
      : "bg-slate-400";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300">
      {children}
    </span>
  );
}

export default function UsersTable({
  rows,
  loading,
  onRowClick,
  onArchive,
  archivingId,
}: {
  rows: UserRow[];
  loading: boolean;
  onRowClick: (id: string) => void;
  onArchive?: (id: string) => void;
  archivingId?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/60 backdrop-blur z-10">
            <tr className="text-left text-xs text-slate-600 dark:text-slate-300">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Rôles</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={7}
                >
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-slate-500"
                  colSpan={7}
                >
                  Aucun utilisateur.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isArchiving = archivingId === u.id;
                return (
                  <tr
                    key={u.id}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                  >
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => onRowClick(u.id)}
                    >
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
                            {u.isActive ? "Actif" : "Inactif"}
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
                      <div className="flex items-center gap-2">
                        <StatusDot status={u.presence?.status} />
                        <span className="capitalize">
                          {u.presence?.status ?? "offline"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {u.extra?.city || u.extra?.country ? (
                        <span className="text-slate-700 dark:text-slate-200">
                          {u.extra?.city || "—"}
                          {u.extra?.country ? `, ${u.extra.country}` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).slice(0, 3).map((r) => (
                          <Badge key={r}>{r}</Badge>
                        ))}
                        {(u.roles || []).length > 3 && (
                          <Badge>+{u.roles.length - 3}</Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRowClick(u.id)}
                          className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="Voir le profil"
                        >
                          Ouvrir
                        </button>
                        <button
                          onClick={() => onArchive?.(u.id)}
                          disabled={isArchiving}
                          className={[
                            "px-2 py-1.5 text-xs rounded-lg text-white",
                            isArchiving
                              ? "bg-red-400 cursor-wait"
                              : "bg-red-600 hover:bg-red-700",
                          ].join(" ")}
                          title="Supprimer le compte"
                        >
                          {isArchiving ? "Suppression…" : "Supprimer"}
                        </button>
                      </div>
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
