/** Statuts de workflow */
export type Statut = "todo" | "in_progress" | "review" | "done";
export const STATUTS: Statut[] = ["todo", "in_progress", "review", "done"];

/** Niveaux de priorité */
export type Priorite = "low" | "medium" | "high";
export const PRIORITES: Priorite[] = ["low", "medium", "high"];

/** Tâche du kanban */
export type Tache = {
  id: string;
  titre: string;

  etiquette?: string;
  /** ISO 8601 (ex: "2025-03-21" ou "2025-03-21T10:00:00.000Z") */
  echeance?: string | null;

  priorite?: Priorite;
  statut: Statut;
  terminee?: boolean;

  imageUrl?: string;
  notes?: string;

  /**
   * Nom d'icône lucide-react choisi à la création (ex: "ListTodo", "Rocket", "Bug").
   * Optionnel : si absent, aucune icône n'est affichée.
   * NOTE: côté backend le champ s’appelle "icon". L’API fait le mapping icon <-> icone.
   */
  icone?: string;

  /**
   * Couleur héritée du projet (hex #RRGGBB). Optionnel.
   * Utile côté UI si l'API l’enrichit directement sur les tâches.
   */
  projectColor?: string;

  /** Horodatages éventuels renvoyés par l'API */
  createdAt?: string;
  updatedAt?: string;
};

/** Projet kanban */
export type Projet = {
  id: string;
  nom: string;

  /** Description courte du projet (optionnelle) */
  description?: string;

  /** Couleur principale du projet (hex #RRGGBB, optionnelle) */
  color?: string;

  createdAt: string;
  /** Peut ne pas être renvoyé selon l’endpoint */
  updatedAt?: string;

  /** Liste des tâches du projet */
  taches: Tache[];
};
