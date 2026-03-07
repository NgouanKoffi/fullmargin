import type { Projet, Statut, Tache } from "../types";
import Column from "./Column";

type Props = {
  projet?: Projet;
  parStatut: Record<Statut, Tache[]>;
  ajouterTache: (s: Statut) => void;
  basculerTerminee: (t: Tache) => void;
  deplacerTache: (t: Tache, s: Statut) => void;
  ouvrirEdition: (t: Tache) => void;
  demanderConfirm: (action: () => void) => void;
  supprimerTache: (t: Tache) => void;
  setTacheView: (t: Tache) => void;
};

export function ProjectBoard({
  projet,
  parStatut,
  ajouterTache,
  basculerTerminee,
  deplacerTache,
  ouvrirEdition,
  demanderConfirm,
  supprimerTache,
  setTacheView,
}: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 mt-6 overflow-visible">
      {!projet ? (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <p className="opacity-70">Aucun projet sélectionné.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start overflow-visible">
          {(["todo", "in_progress", "review", "done"] as Statut[]).map((s) => (
            <Column
              key={s}
              statut={s}
              taches={parStatut[s]}
              onAdd={() => ajouterTache(s)}
              onToggleDone={basculerTerminee}
              onMove={deplacerTache}
              onEdit={(t) => ouvrirEdition(t)}
              onDelete={(t) => demanderConfirm(() => supprimerTache(t))}
              onView={(t) => setTacheView(t)}
              onDropTask={(taskId, _from, to) => {
                const t = projet?.taches.find((x) => x.id === taskId);
                if (!t) return;
                if (t.statut !== to) deplacerTache(t, to);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
