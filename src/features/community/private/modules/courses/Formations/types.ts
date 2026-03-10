// src/pages/communaute/private/community-details/tabs/Formations/types.ts

export type Level = "Débutant" | "Intermédiaire" | "Avancé" | "Tous niveaux";

export type CurriculumItemType = "video" | "pdf" | "image";

export type CurriculumItem = {
  id: string;
  type: CurriculumItemType;
  title: string;
  url?: string | null;
  publicId?: string | null;
  durationMin?: number;
  // utilisé par l'UI (doc, image, link, etc.)
  subtype?: "video" | "doc" | "link" | "image" | string;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  items?: CurriculumItem[];
};

export type Module = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
};

export type Visibility = "public" | "private";

export type CourseDraft = {
  title: string;
  level: Level;
  coverFile: File | null;
  coverPreview: string | null;
  learnings: string[];
  shortDesc: string;
  longDesc: string;
  modules: Module[];
  priceType: "free" | "paid";
  currency?: string;
  price?: number | null;
  visibility: Visibility; // 👈 nouveau : public / privé (membres uniquement)
};
