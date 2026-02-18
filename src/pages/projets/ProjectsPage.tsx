// src/pages/projets/ProjectsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Plus,
  Search,
  ListTodo,
  PlayCircle,
  RefreshCcw,
  CheckCircle2,
  Check,
  FolderGit2,
} from "lucide-react";
import type { Statut, Tache } from "./types";
import ProjectPicker from "./composants/ProjectPicker";
import Column from "./composants/Column";
import Modal from "./composants/Modal";
import ProjectEditor from "./composants/ProjectEditor";
import Confirm from "./composants/Confirm";
import TaskForm from "./composants/TaskForm";
import Dropdown from "./composants/Dropdown";
import TaskDetails from "./composants/TaskDetails";

import { useRemoteProjects } from "./hooks/useRemoteProjects";
import ProjectCreateForm, {
  type ProjectCreatePayload,
} from "./composants/ProjectCreateForm";

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

  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<"priorite" | "echeance" | "alpha">("priorite");

  // ✅ tags connus dans CETTE session (indépendants des tâches)
  const [knownTags, setKnownTags] = useState<string[]>([]);

  // ✅ pour afficher le gros modal de détails
  const [tacheView, setTacheView] = useState<Tache | null>(null);

  // quand on charge un projet pour la première fois, on peut pré-remplir avec ses tags
  useEffect(() => {
    if (!projet) return;
    // si on a déjà des tags manuels, on ne remplace pas
    if (knownTags.length > 0) return;
    const tagsFromTasks = Array.from(
      new Set(
        (projet.taches ?? [])
          .map((t) => (t.etiquette || "").trim())
          .filter(Boolean)
      )
    );
    if (tagsFromTasks.length) {
      setKnownTags(tagsFromTasks);
    }
  }, [projet, knownTags.length]);

  const TRI_LABELS: Record<"priorite" | "echeance" | "alpha", string> = {
    priorite: "Par priorité",
    echeance: "Par échéance",
    alpha: "Alphabétique",
  };

  const tachesFiltrees = useMemo(() => {
    const base = projet?.taches ?? [];
    const byQ = base.filter(
      (t) =>
        t.titre.toLowerCase().includes(recherche.toLowerCase()) ||
        (t.etiquette ?? "").toLowerCase().includes(recherche.toLowerCase())
    );
    const sorted = [...byQ].sort((a, b) => {
      if (tri === "alpha") return a.titre.localeCompare(b.titre);
      if (tri === "echeance")
        return (a.echeance ?? "").localeCompare(b.echeance ?? "");
      const w = { high: 0, medium: 1, low: 2 } as const;
      return w[a.priorite ?? "low"] - w[b.priorite ?? "low"];
    });
    return sorted;
  }, [projet?.taches, recherche, tri]);

  const pickOptionalString = (
    obj: unknown,
    key: string
  ): string | undefined => {
    if (obj && typeof obj === "object") {
      const v = (obj as Record<string, unknown>)[key];
      return typeof v === "string" ? v : undefined;
    }
    return undefined;
  };

  const parStatut = useMemo(() => {
    const g: Record<Statut, Tache[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const t of tachesFiltrees) g[t.statut].push(t);
    return g;
  }, [tachesFiltrees]);

  // Modals tâches
  const [tacheEdit, setTacheEdit] = useState<Tache | null>(null);
  const [modalTacheOpen, setModalTacheOpen] = useState(false);
  function ouvrirEdition(t?: Tache) {
    setTacheEdit(t ?? null);
    setModalTacheOpen(true);
  }

  // Modals projets
  const [openNewProj, setOpenNewProj] = useState(false);

  // Renommage contrôlé
  const [openRenameProj, setOpenRenameProj] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameInitial, setRenameInitial] = useState<string>("");

  // Édition projet
  const [openEditProj, setOpenEditProj] = useState(false);

  // KPI
  const total = projet?.taches.length ?? 0;
  const done =
    projet?.taches.filter((t) => t.terminee || t.statut === "done").length ?? 0;

  const todoCount = parStatut.todo.length;
  const inProgressCount = parStatut.in_progress.length;
  const reviewCount = parStatut.review.length;
  const doneCount = parStatut.done.length;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && todoCount + inProgressCount + reviewCount === 0;
  const globalLabel = allDone
    ? "Projet terminé"
    : total === 0
    ? "Aucune tâche"
    : "Projet en cours";

  // ✅ ajouter un tag local
  function handleTagUsed(tag: string) {
    const clean = tag.trim();
    if (!clean) return;
    setKnownTags((prev) =>
      prev.includes(clean) ? prev : [...prev, clean].slice(0, 50)
    );
  }

  // ✅ supprimer un tag local
  function handleTagDelete(tag: string) {
    setKnownTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#0b0c10] dark:via-[#0b0c10] dark:to-[#0b0c10]">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Ligne 1 : Picker + Search/Tri */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProjectPicker
            currentName={projet?.nom}
            onNew={() => setOpenNewProj(true)}
            onEdit={() => setOpenEditProj(true)}
            onRename={() => {
              if (pid && projet) {
                setRenameId(pid);
                setRenameInitial(projet.nom);
                setOpenRenameProj(true);
              }
            }}
            onDelete={() => demanderConfirm(() => supprimerProjet())}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative basis-auto max-[390px]:basis-full">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une tâche…"
                className="w-full min-w-[180px] pl-8 pr-3 py-2 rounded-xl bg-white/80 dark:bg-neutral-900/80 ring-1 ring-black/10 dark:ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>

            {/* Trier */}
            <Dropdown
              align="end"
              asChild
              menuWidth="220px"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-neutral-900/80 text-skin-base shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                  title="Trier les tâches"
                >
                  Trier : {TRI_LABELS[tri]}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
              }
              items={[
                {
                  label: "Par priorité",
                  iconLeft:
                    tri === "priorite" ? <Check className="w-4 h-4" /> : null,
                  onClick: () => setTri("priorite"),
                },
                {
                  label: "Par échéance",
                  iconLeft:
                    tri === "echeance" ? <Check className="w-4 h-4" /> : null,
                  onClick: () => setTri("echeance"),
                },
                {
                  label: "Alphabétique",
                  iconLeft:
                    tri === "alpha" ? <Check className="w-4 h-4" /> : null,
                  onClick: () => setTri("alpha"),
                },
              ]}
            />
          </div>
        </div>

        {/* Ligne 2 : Boutons + sélection projet compacte */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpenNewProj(true)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white ring-1 ring-violet-500/40 shadow-md hover:shadow-lg hover:brightness-95 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Nouveau projet
          </button>

          <button
            onClick={() => {
              if (!pid) return;
              ouvrirEdition(undefined);
            }}
            disabled={!pid}
            aria-disabled={!pid}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-indigo-600 text-white ring-1 ring-indigo-500/40 shadow-md ${
              !pid
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg hover:opacity-95 active:scale-[0.98]"
            }`}
            title={
              !pid ? "Créez/sélectionnez un projet d’abord" : "Nouvelle tâche"
            }
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Nouvelle tâche
          </button>

          {/* Sélecteur de projets déroulant */}
          <Dropdown
            align="start"
            asChild
            menuWidth="240px"
            menuClassName="max-h-60 overflow-y-auto"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-white/80 dark:bg-neutral-900/80 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                title="Changer de projet"
              >
                <FolderGit2 className="h-4 w-4 opacity-70" />
                {projet?.nom ?? "Sélectionner un projet"}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            }
            items={projets.map((p) => ({
              label: p.nom,
              onClick: () => setPid(p.id),
            }))}
          />
        </div>

        {/* Résumé global + KPI */}
        {projet && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-4">
              <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mb-3">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full transition-all ${
                    allDone
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600"
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 text-sm ${
                    allDone
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/30"
                      : total === 0
                      ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-400/30"
                      : "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-400/30"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {globalLabel}
                </div>

                <span className="rounded-md px-2 py-1 ring-1 ring-black/10 dark:ring-white/10 text-sm">
                  Avancement : {done}/{total} ({pct}%)
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
                  <ListTodo className="h-4 w-4 opacity-70" />
                  <span className="text-sm">À faire</span>
                  <span className="ml-auto font-semibold">{todoCount}</span>
                </div>
                <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 opacity-70" />
                  <span className="text-sm">En cours</span>
                  <span className="ml-auto font-semibold">
                    {inProgressCount}
                  </span>
                </div>
                <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 opacity-70" />
                  <span className="text-sm">À revoir</span>
                  <span className="ml-auto font-semibold">{reviewCount}</span>
                </div>
                <div className="rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-neutral-900/60 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 opacity-70" />
                  <span className="text-sm">Terminé</span>
                  <span className="ml-auto font-semibold">{doneCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="mx-auto max-w-7xl px-4 pb-10 overflow-visible">
        {!projet ? (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
            <p className="opacity-70">Aucun projet sélectionné.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start overflow-visible">
            {(["todo", "in_progress", "review", "done"] as Statut[]).map(
              (s) => (
                <Column
                  key={s}
                  statut={s}
                  taches={parStatut[s]}
                  onAdd={() => ajouterTache(s)}
                  onToggleDone={basculerTerminee}
                  onMove={deplacerTache}
                  onEdit={(t) => ouvrirEdition(t)}
                  onDelete={(t) => demanderConfirm(() => supprimerTache(t))}
                  onView={(t) => setTacheView(t)} // ✅ important
                  onDropTask={(taskId, _from, to) => {
                    const t = projet?.taches.find((x) => x.id === taskId);
                    if (!t) return;
                    if (t.statut !== to) deplacerTache(t, to);
                  }}
                />
              )
            )}
          </div>
        )}
      </div>

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
          onSave={(payload) => {
            // on enregistre côté remote
            enregistrerTache(payload, tacheEdit);
            // ajoute aussi localement le tag si besoin
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

      {/* ✅ Modal de détails */}
      <Modal
        ouvert={!!tacheView}
        titre={tacheView?.titre ?? "Détails de la tâche"}
        onClose={() => setTacheView(null)}
      >
        {tacheView && <TaskDetails task={tacheView} />}
      </Modal>
    </div>
  );
}
