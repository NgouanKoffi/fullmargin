import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Projet, Tache, Statut } from "../types";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  getProject,
  listProjects,
  updateProject,
  updateTask,
} from "../api";

/** Payload accepté par creerProjet depuis l’UI */
export type ProjectCreatePayload = {
  name: string;
  description?: string;
  color?: string; // hex #RRGGBB
};

/** Item renvoyé par listProjects() (on tolère l’absence de meta) */
type ProjectListItem = {
  id: string;
  nom: string;
  createdAt: string;
  description?: string | null;
  color?: string | null;
};

/** Utilitaire : récupère un nom d’icône depuis un payload hétérogène */
function pickIconName(
  p: { icone?: string } & { icon?: string }
): string | undefined {
  if (typeof p.icone === "string" && p.icone.trim()) return p.icone.trim();
  if (typeof p.icon === "string" && p.icon.trim()) return p.icon.trim();
  return undefined;
}

export function useRemoteProjects() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [pid, setPid] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // confirmations
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmAction = useRef<null | (() => void)>(null);
  const demanderConfirm = useCallback((fn: () => void) => {
    confirmAction.current = fn;
    setConfirmOpen(true);
  }, []);
  const runConfirm = useCallback(() => {
    const fn = confirmAction.current;
    setConfirmOpen(false);
    fn?.();
  }, []);

  // charge la liste des projets au mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await listProjects({ limit: 50 });
        const arr: Projet[] = (items as ProjectListItem[]).map((i) => ({
          id: i.id,
          nom: i.nom,
          createdAt: i.createdAt,
          description: i.description ?? "",
          color: (i.color ?? "#7C3AED").toUpperCase(),
          taches: [],
        }));
        if (mounted) {
          setProjets(arr);
          setPid(arr[0]?.id);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // charge les tâches du projet courant
  const projet = useMemo(
    () => projets.find((p) => p.id === pid),
    [projets, pid]
  );

  useEffect(() => {
    if (!pid) return;
    (async () => {
      try {
        const p = await getProject(pid);
        const normalized: Projet = {
          id: p.id,
          nom: p.nom,
          createdAt: p.createdAt,
          description: (p as Partial<Projet>).description ?? "",
          color: ((p as Partial<Projet>).color ?? "#7C3AED").toUpperCase(),
          taches: p.taches,
        };
        setProjets((prev) => prev.map((x) => (x.id === pid ? normalized : x)));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[Projects] Échec du chargement du projet", pid, "→", msg);
      }
    })();
  }, [pid]);

  // === projets
  const creerProjet = useCallback(
    async (input: string | ProjectCreatePayload) => {
      const name =
        (typeof input === "string" ? input : input.name).trim() || "Sans nom";
      const description =
        typeof input === "string" ? "" : input.description ?? "";
      const color = (
        typeof input === "string" ? "#7C3AED" : input.color ?? "#7C3AED"
      ).toUpperCase();

      const { id } = await createProject({ name, description, color });

      const p: Projet = {
        id,
        nom: name,
        createdAt: new Date().toISOString(),
        description,
        color,
        taches: [],
      };
      setProjets((arr) => [p, ...arr]);
      setPid(id);
    },
    []
  );

  const renommerProjet = useCallback(
    async (name?: string) => {
      if (!projet) return;
      const nom = (name ?? projet.nom).trim() || "Sans nom";
      await updateProject(projet.id, { name: nom });
      setProjets((arr) =>
        arr.map((p) => (p.id === projet.id ? { ...p, nom } : p))
      );
    },
    [projet]
  );

  /** ✅ PATCH générique (name/description/color) */
  const modifierProjet = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string; color?: string }
    ) => {
      const payload = { ...data };
      if (payload.color) payload.color = payload.color.toUpperCase();
      await updateProject(id, payload);

      setProjets((arr) =>
        arr.map((p) => {
          if (p.id !== id) return p;
          const nextColor = payload.color ?? p.color;
          return {
            ...p,
            nom:
              payload.name !== undefined ? payload.name || "Sans nom" : p.nom,
            description:
              payload.description !== undefined
                ? payload.description ?? ""
                : p.description,
            color: nextColor,
            // propage la couleur aux tâches si elle change
            taches:
              nextColor !== p.color
                ? p.taches.map((t) => ({ ...t, projectColor: nextColor }))
                : p.taches,
          };
        })
      );
    },
    []
  );

  const supprimerProjet = useCallback(async () => {
    if (!projet) return;
    await deleteProject(projet.id);
    setProjets((arr) => {
      const next = arr.filter((p) => p.id !== projet.id);
      setPid(next[0]?.id);
      return next;
    });
  }, [projet]);

  // === tâches
  const ajouterTache = useCallback(
    async (to: Statut) => {
      if (!projet) return;
      // ⬇️ plus d’étiquette imposée ici
      const { id } = await createTask({
        projectId: projet.id,
        statut: to,
        priorite: "low",
        titre: "Nouvelle tâche",
      });
      const t: Tache = {
        id,
        titre: "Nouvelle tâche",
        statut: to,
        priorite: "low",
        projectColor: projet.color,
      } as Tache;
      setProjets((arr) =>
        arr.map((p) =>
          p.id === projet.id ? { ...p, taches: [t, ...p.taches] } : p
        )
      );
    },
    [projet]
  );

  /** IMPORTANT : accepte payload.icone OU payload.icon */
  const enregistrerTache = useCallback(
    async (
      payload: Partial<Tache> & { icon?: string },
      tacheEdit?: Tache | null
    ) => {
      if (!projet) return;

      const iconeFromPayload = pickIconName(payload);

      if (tacheEdit) {
        // PATCH distant → on récupère l’URL finale
        const { imageUrl: finalImageUrl } = await updateTask(tacheEdit.id, {
          ...(payload as Partial<Tache>),
          projectId: projet.id,
        });

        // maj locale (optimistic) -> on pose toujours .icone pour l’UI
        setProjets((arr) =>
          arr.map((p) => {
            if (p.id !== projet.id) return p;
            return {
              ...p,
              taches: p.taches.map((x) =>
                x.id === tacheEdit.id
                  ? ({
                      ...x,
                      ...payload,
                      imageUrl:
                        finalImageUrl ||
                        (payload.imageUrl as string | undefined) ||
                        x.imageUrl,
                      icone: iconeFromPayload ?? x.icone,
                    } as Tache)
                  : x
              ),
            };
          })
        );
      } else {
        // CREATE distant → récupère aussi l’URL finale
        const { id, imageUrl: finalImageUrl } = await createTask({
          ...(payload as Partial<Tache>),
          projectId: projet.id,
        });

        // ajout local
        const tNew: Tache = {
          id,
          titre: payload.titre || "Nouvelle tâche",
          etiquette: payload.etiquette,
          priorite: payload.priorite ?? "medium",
          statut: payload.statut ?? "todo",
          echeance: payload.echeance,
          terminee: payload.terminee ?? false,
          imageUrl:
            finalImageUrl || (payload.imageUrl as string | undefined) || "",
          notes: payload.notes,
          icone: iconeFromPayload, // <<<< clé consommée par TaskCard
          projectColor: projet.color,
        } as Tache;

        setProjets((arr) =>
          arr.map((p) =>
            p.id === projet.id ? { ...p, taches: [tNew, ...p.taches] } : p
          )
        );
      }
    },
    [projet]
  );

  const deplacerTache = useCallback(
    async (t: Tache, to: Statut) => {
      if (!projet) return;
      await updateTask(t.id, {
        statut: to,
        terminee: to === "done" ? true : false,
        projectId: projet.id,
      });
      setProjets((arr) =>
        arr.map((p) =>
          p.id === projet.id
            ? {
                ...p,
                taches: p.taches.map((x) =>
                  x.id === t.id
                    ? { ...x, statut: to, terminee: to === "done" }
                    : x
                ),
              }
            : p
        )
      );
    },
    [projet]
  );

  const basculerTerminee = useCallback(
    async (t: Tache) => {
      if (!projet) return;
      const nextTerminee = !t.terminee;
      const nextStatut = nextTerminee
        ? "done"
        : t.statut === "done"
        ? "todo"
        : t.statut;
      await updateTask(t.id, {
        terminee: nextTerminee,
        statut: nextStatut,
        projectId: projet.id,
      });
      setProjets((arr) =>
        arr.map((p) =>
          p.id === projet.id
            ? {
                ...p,
                taches: p.taches.map((x) =>
                  x.id === t.id
                    ? { ...x, terminee: nextTerminee, statut: nextStatut }
                    : x
                ),
              }
            : p
        )
      );
    },
    [projet]
  );

  const supprimerTache = useCallback(
    async (t: Tache) => {
      if (!projet) return;
      await deleteTask(t.id);
      setProjets((arr) =>
        arr.map((p) =>
          p.id === projet.id
            ? { ...p, taches: p.taches.filter((x) => x.id !== t.id) }
            : p
        )
      );
    },
    [projet]
  );

  return {
    projets,
    pid,
    setPid,
    projet,
    loading,
    confirmOpen,
    setConfirmOpen,
    demanderConfirm,
    runConfirm,
    creerProjet,
    renommerProjet,
    modifierProjet,
    supprimerProjet,
    ajouterTache,
    enregistrerTache,
    deplacerTache,
    basculerTerminee,
    supprimerTache,
  };
}
