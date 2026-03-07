// ✅ import en export nommé
import type { CreatePayload } from "@shared/components/feed/PostComposer/types";

export type PublicationsProps = {
  communityId: string;
  currentUserId: string | null;
  onRequireAuth?: () => void;
  isAuthenticated: boolean;
  isOwner: boolean;
  isMember: boolean;
  allowSubscribersPosts: boolean;
};

export type ApiOk<T = unknown> = {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type MineItemMedia = {
  kind: "image" | "video";
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  publicId?: string;
};

export type MineItem = {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  media: MineItemMedia[];
  isPublished?: boolean;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

// 👇 on ajoute "subs" ici
export type TabKey = "feed" | "mine" | "subs" | "deleted";

// on le ré-exporte si besoin ailleurs
export type { CreatePayload };
