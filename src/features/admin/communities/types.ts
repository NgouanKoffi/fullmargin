// src/features/admin/communities/types.ts

export type TabKey = "communities" | "courses" | "requests";

export type CommunityItem = {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  visibility: string;
  membersCount: number;
  postsCount: number;
  owner?: { fullName?: string; email?: string };
  logoUrl?: string;
  createdAt: string;
  status?: string;
  deletedAt?: string | null;
  warningCount?: number;
};

export type CourseItem = {
  id: string;
  title: string;
  slug: string;
  visibility: string;
  priceType: string;
  ownerName?: string;
  ownerEmail?: string;
  owner?: { email?: string };
  enrollmentCount?: number;
  coverUrl?: string;
  communitySlug?: string;
  createdAt: string;
};

export type ToastType = "success" | "error" | "info";
export type Toast = { type: ToastType; message: string; id: number };
