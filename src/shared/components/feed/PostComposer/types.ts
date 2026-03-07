// src/pages/communaute/private/community-details/tabs/PostComposer/types.ts

export type Visibility = "private" | "public";

export type CreatePayload = {
  text: string;
  files: File[];
  scheduledAt?: string | null;
  /** Visibilité du post : par défaut "private" si non précisé */
  visibility?: Visibility;
};

export type ApiStd = { ok?: boolean; error?: string | null };

export type ExistingMedia = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  publicId: string;
  _removed?: boolean;
};

export type SessionUserProfile = Record<string, unknown>;

export type SessionUser = {
  id?: unknown;
  _id?: unknown;
  avatarUrl?: unknown;
  profile?: SessionUserProfile;
};

export type SessionShape =
  | {
      user?: SessionUser;
      userId?: unknown;
      avatarUrl?: unknown;
      expiresAt?: number;
      token?: string;
    }
  | null
  | undefined;
