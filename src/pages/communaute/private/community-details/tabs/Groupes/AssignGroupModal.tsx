// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\AssignGroupModal.tsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Layers, X } from "lucide-react";

import type { GroupLite } from "../../api/groups.api";
import type { CommunityMemberLite } from "../../components/CommunityMembersList";
import { loadSession } from "../../../../../../auth/lib/storage";
import { API_BASE } from "../../../../../../lib/api";

type MembershipState = {
  isMember: boolean;
  membersCount: number;
};

type PerGroupState = Record<
  string,
  {
    loading: boolean;
    error: string | null;
    membership: MembershipState | null;
  }
>;

function getAuthHeaders() {
  const session = loadSession() as { token?: string } | null;
  const token = session?.token;
  if (!token) return null;

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export type AssignGroupModalProps = {
  open: boolean;
  onClose: () => void;
  member: CommunityMemberLite;
  groups: GroupLite[];
};

export default function AssignGroupModal({
  open,
  onClose,
  member,
  groups,
}: AssignGroupModalProps) {
  const [perGroup, setPerGroup] = useState<PerGroupState>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Charger le statut d’appartenance de ce membre pour chaque groupe
  useEffect(() => {
    if (!open) return;
    if (!member?.id || !groups?.length) return;

    const headers = getAuthHeaders();
    if (!headers) {
      setGlobalError("Connexion requise pour gérer les groupes.");
      return;
    }

    const base = API_BASE.replace(/\/+$/, "");

    setPerGroup(() =>
      groups.reduce<PerGroupState>((acc, g) => {
        acc[g.id] = { loading: true, error: null, membership: null };
        return acc;
      }, {})
    );
    setGlobalError(null);

    let cancelled = false;

    (async () => {
      try {
        for (const g of groups) {
          const url = `${base}/communaute/groups/${encodeURIComponent(
            g.id
          )}/admin-membership?userId=${encodeURIComponent(member.id)}`;

          try {
            const res = await fetch(url, { headers });
            const json = await res.json().catch(() => ({}));

            if (!res.ok || !json.ok) {
              throw new Error(json?.error || "Lecture impossible");
            }

            if (cancelled) return;

            setPerGroup((prev) => ({
              ...prev,
              [g.id]: {
                loading: false,
                error: null,
                membership: {
                  isMember: !!json.data?.isMember,
                  membersCount: Number(json.data?.membersCount || 0),
                },
              },
            }));
          } catch (e) {
            if (cancelled) return;
            setPerGroup((prev) => ({
              ...prev,
              [g.id]: {
                loading: false,
                error:
                  e instanceof Error
                    ? e.message
                    : "Impossible de lire le statut",
                membership: null,
              },
            }));
          }
        }
      } catch (e) {
        if (cancelled) return;
        setGlobalError(
          e instanceof Error ? e.message : "Erreur de chargement des groupes"
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, member?.id, groups]);

  const handleToggle = async (group: GroupLite) => {
    const headers = getAuthHeaders();
    if (!headers) {
      alert("Connexion requise.");
      return;
    }

    const current = perGroup[group.id]?.membership;
    const isMember = !!current?.isMember;
    const base = API_BASE.replace(/\/+$/, "");

    const url = isMember
      ? `${base}/communaute/groups/${encodeURIComponent(
          group.id
        )}/admin-remove-member`
      : `${base}/communaute/groups/${encodeURIComponent(
          group.id
        )}/admin-add-member`;

    try {
      setPerGroup((prev) => ({
        ...prev,
        [group.id]: {
          ...(prev[group.id] || { membership: null, error: null }),
          loading: true,
        },
      }));

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: member.id }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Action impossible");
      }

      const newIsMember = !isMember;
      const newCount = current
        ? current.membersCount + (newIsMember ? 1 : -1)
        : newIsMember
        ? 1
        : 0;

      setPerGroup((prev) => ({
        ...prev,
        [group.id]: {
          loading: false,
          error: null,
          membership: {
            isMember: newIsMember,
            membersCount: Math.max(0, newCount),
          },
        },
      }));
    } catch (e) {
      setPerGroup((prev) => ({
        ...prev,
        [group.id]: {
          ...(prev[group.id] || { membership: current }),
          loading: false,
          error: e instanceof Error ? e.message : "Impossible de mettre à jour",
        },
      }));
    }
  };

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700/80 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Attribution de groupes
            </p>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {member.fullName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          {globalError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200/70 dark:border-rose-700/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
              {globalError}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sélectionne les groupes auxquels{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {member.fullName}
            </span>{" "}
            aura accès. Tu peux l’ajouter ou le retirer en un clic, sans passer
            par les écrans publics.
          </p>

          {groups.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aucun groupe n’est disponible dans cette communauté.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70">
              {groups.map((g) => {
                const state = perGroup[g.id];
                const isLoading = state?.loading;
                const membership = state?.membership;
                const isMember = !!membership?.isMember;
                const membersCount =
                  membership?.membersCount ?? g.membersCount ?? 0;

                return (
                  <li
                    key={g.id}
                    className="px-4 py-3 text-sm flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    {/* Infos du groupe */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200">
                          <Layers className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-50 truncate">
                            {g.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {membersCount} membre(s) ·{" "}
                            {g.accessType === "course"
                              ? "lié à une formation"
                              : "accès libre"}
                          </p>
                        </div>
                      </div>
                      {state?.error && (
                        <p className="mt-1 text-[11px] text-rose-500">
                          {state.error}
                        </p>
                      )}
                    </div>

                    {/* Bouton : pleine largeur en mobile, à droite en desktop */}
                    <button
                      disabled={isLoading}
                      onClick={() => handleToggle(g)}
                      className={[
                        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium border",
                        "w-full sm:w-auto sm:self-start",
                        isMember
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/70"
                          : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100",
                        isLoading ? "opacity-70 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isMember ? (
                        "Retirer du groupe"
                      ) : (
                        "Ajouter à ce groupe"
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
