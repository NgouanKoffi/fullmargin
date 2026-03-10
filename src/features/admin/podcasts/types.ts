// src/pages/podcasts/types.ts

export type PodcastStatus = "brouillon" | "publie";

/** Langues supportées pour un podcast */
export type PodcastLanguage = "fr" | "en";
export const PODCAST_LANGUAGES: ReadonlyArray<PodcastLanguage> = ["fr", "en"];

export const PODCAST_LANGUAGE_LABEL: Record<PodcastLanguage, string> = {
  fr: "Français",
  en: "English",
};

export type Podcast = {
  id: string;
  title: string;
  author?: string;
  category: string;
  html?: string;
  coverUrl?: string;
  audioUrl?: string;
  duration?: number;
  status: PodcastStatus;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string | null;

  /** Nouvelle méta : langue du contenu (FR/EN). Optionnelle pour compat rétro. */
  language?: PodcastLanguage;

  /** --- Audit (backend renvoyé par /podcasts) --- */
  userId?: string; // propriétaire (créateur initial)
  createdById?: string; // alias pratique (cf. api.ts)
  createdByName?: string; // optionnel
  createdByEmail?: string; // optionnel
};
