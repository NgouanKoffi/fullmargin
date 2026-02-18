// src/pages/communaute/private/community-details/tabs/Formations/AssignCourseAccessTab.tsx
import { useState } from "react";
import type { CourseSavedWithAgg } from "../Formations";
import {
  CommunityMembersList,
  type CommunityMemberLite,
} from "../../components/CommunityMembersList";
import { AssignCourseAccessModal } from "./AssignCourseAccessModal";

type Props = {
  canCreate: boolean;
  communityId: string;
  courses: CourseSavedWithAgg[];
  loading: boolean;
  error: string | null;
};

export function AssignCourseAccessTab({
  canCreate,
  communityId,
  courses,
  loading,
  error,
}: Props) {
  const [selectedMember, setSelectedMember] =
    useState<CommunityMemberLite | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!canCreate) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 text-sm text-slate-600 dark:text-slate-300">
        Seul le propriétaire / administrateur de la communauté peut gérer les
        droits d’accès aux formations.
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-5">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Attribuer des accès aux formations
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Clique sur un abonné pour ouvrir la fenêtre d’attribution et choisir à
          quelle formation payante tu veux lui donner (ou retirer) l’accès.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Chargement des formations…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Liste des abonnés */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Abonnés de la communauté
        </h4>
        <CommunityMembersList
          communityId={communityId}
          selectedId={selectedMember?.id ?? null}
          onSelectMember={(m) => {
            setSelectedMember(m);
            setModalOpen(true);
          }}
        />
      </div>

      {/* Modal d’attribution */}
      {selectedMember && (
        <AssignCourseAccessModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          communityId={communityId}
          member={selectedMember}
          courses={courses}
        />
      )}
    </div>
  );
}
