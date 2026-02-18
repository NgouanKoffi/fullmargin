// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\AssignAccessTab.tsx

import { useState } from "react";

import type { GroupLite } from "../../api/groups.api";
import {
  CommunityMembersList,
  type CommunityMemberLite,
} from "../../components/CommunityMembersList";

import AssignGroupModal from "./AssignGroupModal";

type Props = {
  communityId: string;
  groups: GroupLite[] | null;
  loading: boolean;
  error: string | null;
};

export function AssignAccessTab({
  communityId,
  groups,
  loading,
  error,
}: Props) {
  const hasGroups = !!groups && groups.length > 0;

  const [selectedMember, setSelectedMember] =
    useState<CommunityMemberLite | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectMember = (m: CommunityMemberLite) => {
    setSelectedMember(m);
    setModalOpen(true);
  };

  return (
    <div className="mt-2 space-y-4">
      {/* Bloc d’intro */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Attribuer des accès aux groupes
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Depuis cet onglet, tu peux prendre n’importe quel abonné de ta
          communauté et l’ajouter ou le retirer manuellement d’un ou plusieurs
          groupes, sans passer par les écrans publics.
        </p>
      </div>

      {/* État du chargement de la liste des groupes */}
      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Chargement des groupes…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && !hasGroups && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tu n’as encore aucun groupe dans cette communauté. Crée d’abord au
          moins un groupe pour pouvoir attribuer des accès.
        </p>
      )}

      {/* Liste des abonnés + sélection */}
      {!loading && !error && hasGroups && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Commence par choisir un abonné dans la liste ci-dessous, puis
            sélectionne les groupes auxquels tu veux lui donner accès.
          </p>

          <CommunityMembersList
            communityId={communityId}
            onSelectMember={handleSelectMember}
            selectedId={selectedMember?.id ?? null}
          />
        </div>
      )}

      {/* Modal d’assignation */}
      {modalOpen && selectedMember && hasGroups && (
        <AssignGroupModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          member={selectedMember}
          groups={groups!}
        />
      )}
    </div>
  );
}
