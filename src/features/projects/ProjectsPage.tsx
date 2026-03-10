// src/pages/projets/ProjectsPage.tsx
import { useRemoteProjects } from "./hooks/useRemoteProjects";
import { useProjectsFilter } from "./hooks/useProjectsFilter";
import { useProjectsModals } from "./hooks/useProjectsModals";

import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectSummary } from "./components/ProjectSummary";
import { ProjectBoard } from "./components/ProjectBoard";
import { ProjectModals } from "./components/ProjectModals";

export default function ProjectsPage() {
  const {
    projets,
    pid,
    setPid,
    projet,
    confirmOpen,
    setConfirmOpen,
    demanderConfirm,
    runConfirm,
    creerProjet,
    renommerProjet,
    supprimerProjet,
    ajouterTache,
    enregistrerTache,
    deplacerTache,
    basculerTerminee,
    supprimerTache,
    modifierProjet,
  } = useRemoteProjects();

  const {
    recherche,
    setRecherche,
    tri,
    setTri,
    TRI_LABELS,
    parStatut,
    knownTags,
    handleTagUsed,
    handleTagDelete,
    total,
    done,
    todoCount,
    inProgressCount,
    reviewCount,
    doneCount,
    pct,
    allDone,
    globalLabel,
  } = useProjectsFilter(projet);

  const {
    tacheEdit,
    setTacheEdit,
    modalTacheOpen,
    setModalTacheOpen,
    openNewProj,
    setOpenNewProj,
    openRenameProj,
    setOpenRenameProj,
    renameId,
    renameInitial,
    openEditProj,
    setOpenEditProj,
    tacheView,
    setTacheView,
    ouvrirEdition,
    ouvrirRenommage,
  } = useProjectsModals();

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#0b0c10] dark:via-[#0b0c10] dark:to-[#0b0c10]">
      {/* Header */}
      <ProjectHeader
        projet={projet}
        projets={projets}
        pid={pid ?? null}
        setPid={setPid}
        recherche={recherche}
        setRecherche={setRecherche}
        tri={tri}
        setTri={setTri}
        TRI_LABELS={TRI_LABELS}
        onNewProj={() => setOpenNewProj(true)}
        onEditProj={() => setOpenEditProj(true)}
        onRenameProj={() => {
          if (pid && projet) {
            ouvrirRenommage(pid, projet.nom);
          }
        }}
        onDeleteProj={() => demanderConfirm(() => supprimerProjet())}
        onNewTask={() => {
          if (!pid) return;
          ouvrirEdition(undefined);
        }}
      />

      {/* Résumé global + KPI */}
      <ProjectSummary
        projet={projet}
        pct={pct}
        allDone={allDone}
        globalLabel={globalLabel}
        done={done}
        total={total}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        reviewCount={reviewCount}
        doneCount={doneCount}
      />

      {/* Board */}
      <ProjectBoard
        projet={projet}
        parStatut={parStatut}
        ajouterTache={ajouterTache}
        basculerTerminee={basculerTerminee}
        deplacerTache={deplacerTache}
        ouvrirEdition={ouvrirEdition}
        demanderConfirm={demanderConfirm}
        supprimerTache={supprimerTache}
        setTacheView={setTacheView}
      />

      {/* Modals centralisés */}
      <ProjectModals
        projet={projet}
        pid={pid ?? null}
        setPid={setPid}
        // Task
        tacheEdit={tacheEdit}
        setTacheEdit={setTacheEdit}
        modalTacheOpen={modalTacheOpen}
        setModalTacheOpen={setModalTacheOpen}
        knownTags={knownTags}
        handleTagUsed={handleTagUsed}
        handleTagDelete={handleTagDelete}
        enregistrerTache={enregistrerTache}
        // New Proj
        openNewProj={openNewProj}
        setOpenNewProj={setOpenNewProj}
        creerProjet={creerProjet}
        // Edit Proj
        openEditProj={openEditProj}
        setOpenEditProj={setOpenEditProj}
        modifierProjet={modifierProjet}
        renommerProjet={renommerProjet}
        // Rename
        openRenameProj={openRenameProj}
        setOpenRenameProj={setOpenRenameProj}
        renameId={renameId}
        renameInitial={renameInitial}
        // Confirm
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        runConfirm={runConfirm}
        // View Task
        tacheView={tacheView}
        setTacheView={setTacheView}
      />
    </div>
  );
}
