import { ChevronDown, Plus, Search, Check, FolderGit2 } from "lucide-react";
import ProjectPicker from "./ProjectPicker";
import Dropdown from "./Dropdown";
import type { Projet } from "../types";

type Props = {
  projet?: Projet;
  projets: Projet[];
  pid: string | null;
  setPid: (id: string) => void;
  recherche: string;
  setRecherche: (q: string) => void;
  tri: "priorite" | "echeance" | "alpha";
  setTri: (t: "priorite" | "echeance" | "alpha") => void;
  TRI_LABELS: Record<string, string>;
  onNewProj: () => void;
  onEditProj: () => void;
  onRenameProj: () => void;
  onDeleteProj: () => void;
  onNewTask: () => void;
};

export function ProjectHeader({
  projet,
  projets,
  pid,
  setPid,
  recherche,
  setRecherche,
  tri,
  setTri,
  TRI_LABELS,
  onNewProj,
  onEditProj,
  onRenameProj,
  onDeleteProj,
  onNewTask,
}: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Ligne 1 : Picker + Search/Tri */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProjectPicker
          currentName={projet?.nom}
          onNew={onNewProj}
          onEdit={onEditProj}
          onRename={onRenameProj}
          onDelete={onDeleteProj}
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
                iconLeft: tri === "priorite" ? <Check className="w-4 h-4" /> : null,
                onClick: () => setTri("priorite"),
              },
              {
                label: "Par échéance",
                iconLeft: tri === "echeance" ? <Check className="w-4 h-4" /> : null,
                onClick: () => setTri("echeance"),
              },
              {
                label: "Alphabétique",
                iconLeft: tri === "alpha" ? <Check className="w-4 h-4" /> : null,
                onClick: () => setTri("alpha"),
              },
            ]}
          />
        </div>
      </div>

      {/* Ligne 2 : Boutons + sélection projet compacte */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onNewProj}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white ring-1 ring-violet-500/40 shadow-md hover:shadow-lg hover:brightness-95 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Nouveau projet
        </button>

        <button
          onClick={onNewTask}
          disabled={!pid}
          aria-disabled={!pid}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-indigo-600 text-white ring-1 ring-indigo-500/40 shadow-md ${
            !pid
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-lg hover:opacity-95 active:scale-[0.98]"
          }`}
          title={!pid ? "Créez/sélectionnez un projet d’abord" : "Nouvelle tâche"}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Nouvelle tâche
        </button>

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
    </div>
  );
}
