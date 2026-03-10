import type { Projet, Tache } from "../types";
import Modal from "./Modal";
import TaskForm from "./TaskForm";
import ProjectCreateForm, { type ProjectCreatePayload } from "./ProjectCreateForm";
import ProjectEditor from "./ProjectEditor";
import Confirm from "./Confirm";
import TaskDetails from "./TaskDetails";

type Props = {
  projet?: Projet;
  pid: string | null;
  setPid: (id: string) => void;
  // task state
  tacheEdit: Tache | null;
  setTacheEdit: (t: Tache | null) => void;
  modalTacheOpen: boolean;
  setModalTacheOpen: (val: boolean) => void;
  knownTags: string[];
  handleTagUsed: (t: string) => void;
  handleTagDelete: (t: string) => void;
  enregistrerTache: (partial: Partial<Tache>, tEdit: Tache | null) => void;
  // new proj
  openNewProj: boolean;
  setOpenNewProj: (val: boolean) => void;
  creerProjet: (p: ProjectCreatePayload) => void;
  // edit proj
  openEditProj: boolean;
  setOpenEditProj: (val: boolean) => void;
  modifierProjet?: (id: string, updates: any) => void;
  renommerProjet: (name: string) => void;
  // rename proj
  openRenameProj: boolean;
  setOpenRenameProj: (val: boolean) => void;
  renameId: string | null;
  renameInitial: string;
  // confirm
  confirmOpen: boolean;
  setConfirmOpen: (val: boolean) => void;
  runConfirm: () => void;
  // view task
  tacheView: Tache | null;
  setTacheView: (t: Tache | null) => void;
};

const pickOptionalString = (obj: unknown, key: string): string | undefined => {
  if (obj && typeof obj === "object") {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
};

export function ProjectModals({
  projet,
  pid,
  setPid,
  // Task
  tacheEdit,
  setTacheEdit,
  modalTacheOpen,
  setModalTacheOpen,
  knownTags,
  handleTagUsed,
  handleTagDelete,
  enregistrerTache,
  // New Proj
  openNewProj,
  setOpenNewProj,
  creerProjet,
  // Edit Proj
  openEditProj,
  setOpenEditProj,
  modifierProjet,
  renommerProjet,
  // Rename Proj
  openRenameProj,
  setOpenRenameProj,
  renameId,
  renameInitial,
  // Confirm
  confirmOpen,
  setConfirmOpen,
  runConfirm,
  // View Task
  tacheView,
  setTacheView,
}: Props) {
  return (
    <>
      {/* Modal édition tâche */}
      <Modal
        ouvert={modalTacheOpen}
        titre={tacheEdit ? "Modifier la tâche" : "Nouvelle tâche"}
        onClose={() => setModalTacheOpen(false)}
      >
        <TaskForm
          initial={tacheEdit ?? { statut: "todo", priorite: "medium" }}
          suggestedTags={knownTags}
          onTagUsed={handleTagUsed}
          onTagDelete={handleTagDelete}
          onSave={(payload: Partial<Tache>) => {
            enregistrerTache(payload, tacheEdit);
            const tag = (payload.etiquette || "").trim();
            if (tag) handleTagUsed(tag);
            setModalTacheOpen(false);
            setTacheEdit(null);
          }}
          onCancel={() => setModalTacheOpen(false)}
        />
      </Modal>

      {/* Nouveau projet */}
      <Modal
        ouvert={openNewProj}
        titre="Nouveau projet"
        onClose={() => setOpenNewProj(false)}
      >
        <ProjectCreateForm
          onCancel={() => setOpenNewProj(false)}
          onCreate={(p: ProjectCreatePayload) => {
            creerProjet(p);
            setOpenNewProj(false);
          }}
        />
      </Modal>

      {/* Modifier le projet */}
      <Modal
        ouvert={openEditProj}
        titre="Modifier le projet"
        onClose={() => setOpenEditProj(false)}
      >
        <ProjectCreateForm
          initial={{
            name: projet?.nom ?? "",
            description: pickOptionalString(projet, "description") ?? "",
            color: pickOptionalString(projet, "color") ?? "#7C3AED",
          }}
          onCancel={() => setOpenEditProj(false)}
          onCreate={(p: ProjectCreatePayload) => {
            if (pid) {
              modifierProjet?.(pid, {
                name: p.name,
                description: p.description,
                color: p.color,
              });
            } else if (p.name) {
              renommerProjet(p.name);
            }
            setOpenEditProj(false);
          }}
        />
      </Modal>

      {/* Renommer projet */}
      <ProjectEditor
        key={openRenameProj ? `rename-${renameId ?? "none"}` : "rename-closed"}
        open={openRenameProj}
        title="Renommer le projet"
        confirmLabel="Renommer"
        initialName={renameInitial}
        onClose={() => setOpenRenameProj(false)}
        onSubmit={(name) => {
          if (renameId) setPid(renameId);
          renommerProjet(name);
          setOpenRenameProj(false);
        }}
      />

      <Confirm
        open={confirmOpen}
        title="Confirmation"
        message="Êtes-vous sûr(e) de vouloir continuer ?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runConfirm}
      />

      {/* Détails de la tâche */}
      <Modal
        ouvert={!!tacheView}
        titre={tacheView?.titre ?? "Détails de la tâche"}
        onClose={() => setTacheView(null)}
      >
        {tacheView && <TaskDetails task={tacheView} />}
      </Modal>
    </>
  );
}
