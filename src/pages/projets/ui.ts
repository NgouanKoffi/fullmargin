import type { Statut, Priorite } from "./types";

export const STATUT_META: Record<Statut, { titre: string; ring: string; bg: string }> = {
  todo: {
    titre: "À faire",
    ring: "ring-indigo-300/40",
    bg: "bg-indigo-50/60 dark:bg-indigo-500/10",
  },
  in_progress: {
    titre: "En cours",
    ring: "ring-sky-300/40",
    bg: "bg-sky-50/60 dark:bg-sky-500/10",
  },
  review: {
    titre: "À revoir",
    ring: "ring-amber-300/40",
    bg: "bg-amber-50/60 dark:bg-amber-500/10",
  },
  done: {
    titre: "Terminé",
    ring: "ring-emerald-300/40",
    bg: "bg-emerald-50/60 dark:bg-emerald-500/10",
  },
};

export const P_DOT: Record<Priorite, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};
