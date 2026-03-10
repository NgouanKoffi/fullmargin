import { useMemo, useState } from "react";
import type { Projet, Statut, Tache } from "../types";

export function useProjectsFilter(projet: Projet | undefined) {
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<"priorite" | "echeance" | "alpha">("priorite");
  const [knownTags, setKnownTags] = useState<string[]>([]);

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

  function handleTagUsed(tag: string) {
    const clean = tag.trim();
    if (!clean) return;
    setKnownTags((prev) =>
      prev.includes(clean) ? prev : [...prev, clean].slice(0, 50)
    );
  }

  function handleTagDelete(tag: string) {
    setKnownTags((prev) => prev.filter((t) => t !== tag));
  }

  // KPIs
  const total = projet?.taches.length ?? 0;
  const done = projet?.taches.filter((t) => t.terminee || t.statut === "done").length ?? 0;
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

  return {
    recherche,
    setRecherche,
    tri,
    setTri,
    TRI_LABELS,
    tachesFiltrees,
    parStatut,
    knownTags,
    setKnownTags,
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
  };
}
