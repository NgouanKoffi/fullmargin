// src/pages/course/CoursePlayer/coursePlayerTypes.ts

export type CurriculumItem = {
  id: string;
  type: "video" | "pdf" | "image"; // côté back on a encore "pdf" pour certains cas
  subtype?: string | null; // "doc" | "image" | "link" | "video"
  title: string;
  url?: string;
  publicId?: string;
  durationMin?: number;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string; // JSON BlockNote
  items?: CurriculumItem[];
};

export type ModuleT = {
  id: string;
  title: string;
  description?: string; // JSON BlockNote
  lessons?: Lesson[];
};

export type CourseSaved = {
  id: string;
  communityId?: string;
  ownerId?: string;
  coverUrl?: string;
  title: string;
  shortDesc?: string;
  description?: string;
  modules?: ModuleT[];
  priceType: "free" | "paid";
  currency?: string;
  price?: number;
  ratingAvg?: number | null;
  reviewsCount?: number;
  // pour l'entête / stats
  level?: string;
  updatedAt?: string;
  enrollmentCount?: number;
};

export type SessionUser = {
  _id?: string;
  id?: string;
  roles?: string[];
};

export type Session = { token?: string; user?: SessionUser } | null;
