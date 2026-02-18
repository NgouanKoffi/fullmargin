// src/pages/communaute/private/community-details/tabs/GroupesTab.tsx
import { useState } from "react";
import { CalendarClock } from "lucide-react";

import CreateGroupModal from "./Groupes/CreateGroupModal";
import EditGroupModal from "./Groupes/EditGroupModal";
import { GroupsGrid } from "../../../public/sections/groupes/GroupsGrid";
import GroupDetailsModal from "../../../public/sections/groupes/GroupDetailsModal";
import MembersOnlyAlert from "../../../../../components/community/MembersOnlyAlert";
import type { GroupLite } from "../api/groups.api";
import type { PublicGroup } from "../../../public/sections/groupes/types";
import DeleteGroupModal from "./Groupes/DeleteGroupModal";
import { useGroupsTab } from "./Groupes/useGroupsTab";
import { AssignAccessTab } from "./Groupes/AssignAccessTab";

type Props = {
  communityId: string;
  isOwner: boolean;
  isMember: boolean;
  isAuthenticated: boolean;
};

type SubTab = "groups" | "access";

export default function GroupesTab({
  communityId,
  isOwner,
  isMember,
  isAuthenticated,
}: Props) {
  const canCreate = isOwner;
  const canSeeList = isMember || isOwner;

  const {
    groups,
    loading,
    error,
    membershipsMap,
    activeGroup,
    membership,
    membershipLoading,
    membershipError,
    deleteTarget,
    deletingId,
    hasGroups,

    openAuthModal,
    openJoinCommunity,
    handleAskDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenGroup,
    handleToggleMembership,
    handleCloseModal,
    handleDiscussGroup,
  } = useGroupsTab({
    communityId,
    isOwner,
    isMember,
    isAuthenticated,
  });

  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupLite | null>(null);

  const [subTab, setSubTab] = useState<SubTab>("groups");

  /* ---------- Garde accès ---------- */

  if (!isAuthenticated) {
    return (
      <div className="w-full">
        <MembersOnlyAlert
          title="Groupes réservés aux membres"
          description="Connecte-toi pour voir et rejoindre les groupes de cette communauté."
          ctaLabel="Se connecter"
          onCtaClick={openAuthModal}
        />
      </div>
    );
  }

  if (!canSeeList) {
    return (
      <div className="w-full">
        <MembersOnlyAlert
          title="Groupes réservés aux membres"
          description="Deviens membre de cette communauté pour accéder aux groupes."
          ctaLabel="Rejoindre la communauté"
          onCtaClick={openJoinCommunity}
        />
      </div>
    );
  }

  /* ---------- Rendu principal ---------- */

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 p-6 border border-slate-100/60 dark:border-slate-800/60">
        {/* Header : titre + bouton + sous-onglets */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate text-slate-900 dark:text-slate-50">
                  Groupes de la communauté
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CalendarClock className="h-4 w-4 opacity-60" />
                  <span>
                    {isOwner
                      ? "Organise les membres en petits groupes thématiques ou privés."
                      : "Découvre et rejoins les groupes créés dans cette communauté."}
                  </span>
                </p>
              </div>
            </div>

            {/* Mini tabview : Groupes / Attribuer accès (owner only) */}
            {isOwner && (
              <div className="pt-1 flex justify-start">
                <div className="inline-flex items-center rounded-full border border-violet-500/70 bg-slate-900/95 px-1.5 py-1 shadow-lg shadow-violet-500/25">
                  <button
                    type="button"
                    onClick={() => setSubTab("groups")}
                    className={[
                      "relative px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200",
                      subTab === "groups"
                        ? "bg-violet-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] shadow-violet-500/60"
                        : "text-slate-300/80 hover:text-white hover:bg-slate-800/80",
                    ].join(" ")}
                  >
                    Groupes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab("access")}
                    className={[
                      "relative px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200",
                      subTab === "access"
                        ? "bg-violet-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] shadow-violet-500/60"
                        : "text-slate-300/80 hover:text-white hover:bg-slate-800/80",
                    ].join(" ")}
                  >
                    Accès
                  </button>
                </div>
              </div>
            )}
          </div>

          {canCreate && subTab === "groups" && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition"
            >
              <span className="text-base leading-none">＋</span>
              <span>Nouveau groupe</span>
            </button>
          )}
        </div>

        {/* --------- CONTENU SOUS-ONGLETS --------- */}

        {subTab === "groups" && (
          <>
            {error && (
              <div className="mb-4 rounded-xl bg-red-50/90 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm px-4 py-3">
                {error}
              </div>
            )}

            {loading && !hasGroups && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-200">
                Chargement des groupes…
              </div>
            )}

            {/* 👇 état "aucun groupe" différent pour owner vs membre */}
            {!loading && !hasGroups && !error && (
              <>
                {isOwner ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                    <p className="mb-2">
                      Tu n’as pas encore créé de groupe dans cette communauté.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Crée des groupes privés ou publics.</li>
                      <li>Gère les membres de chaque groupe.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                    Aucun groupe n’a encore été créé dans cette communauté.
                  </div>
                )}
              </>
            )}

            {hasGroups && groups && (
              <GroupsGrid
                groups={(groups as unknown as PublicGroup[]) || []}
                memberships={membershipsMap}
                onSelectGroup={(g) =>
                  handleOpenGroup(g as unknown as GroupLite)
                }
                onDiscussGroup={(g) =>
                  handleDiscussGroup(g as unknown as GroupLite)
                }
                isOwnerView={isOwner}
                onEditGroup={
                  isOwner
                    ? (g) => setEditingGroup(g as unknown as GroupLite)
                    : undefined
                }
                onDeleteGroup={
                  isOwner
                    ? (g) => handleAskDelete(g as unknown as GroupLite)
                    : undefined
                }
                deletingId={deletingId}
              />
            )}
          </>
        )}

        {subTab === "access" && isOwner && (
          <AssignAccessTab
            communityId={communityId}
            groups={groups}
            loading={loading}
            error={error}
          />
        )}
      </div>

      {creating && (
        <CreateGroupModal
          communityId={communityId}
          onClose={() => setCreating(false)}
        />
      )}

      {editingGroup && (
        <EditGroupModal
          communityId={communityId}
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {deleteTarget && (
        <DeleteGroupModal
          open={!!deleteTarget}
          group={deleteTarget}
          busy={deletingId === deleteTarget.id}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal de détails / rejoindre / quitter */}
      {activeGroup && (
        <GroupDetailsModal
          group={activeGroup}
          membership={membership}
          loading={membershipLoading}
          error={membershipError}
          onClose={handleCloseModal}
          onToggleMembership={handleToggleMembership}
        />
      )}
    </div>
  );
}
