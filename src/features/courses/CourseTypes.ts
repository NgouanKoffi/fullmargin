// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\course\CourseTypes.ts

/* ---------- Types programme ---------- */
export type CurriculumItem = {
  id: string;
  type: "video" | "pdf";
  title: string;
  durationMin?: number;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  items?: CurriculumItem[];
};

export type ModuleT = {
  id: string;
  title: string;
  description?: string;
  lessons?: Lesson[];
};

/* ---------- Type cours ---------- */
export type CourseSaved = {
  id: string;
  createdAt: string;
  updatedAt: string;
  communityId?: string;
  groupId?: string | null;
  ownerId?: string;
  coverUrl?: string;
  title: string;
  level: string;
  learnings: string[];
  shortDesc?: string;
  description?: string;
  modules?: ModuleT[];
  priceType: "free" | "paid";
  currency?: string;
  price?: number;
  enrollmentCount?: number;
  ratingAvg?: number | null;
  reviewsCount?: number;
};

/* ---------- Session / User ---------- */
export type SessionUser = {
  _id?: string;
  id?: string;
  roles?: string[];
  name?: string;
  avatar?: string;
};

export type Session = {
  token?: string;
  user?: SessionUser;
} | null;
