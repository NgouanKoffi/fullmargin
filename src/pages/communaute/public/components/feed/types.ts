// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\types.ts
export type Media = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
};

export type PostLite = {
  id: string; // ObjectId en string
  author: { id?: string; name: string; avatar?: string; isVerified?: boolean };
  createdAt: string; // ISO
  content: string;
  likes: number;
  comments: number;
  media?: Media[];
  access?: "public" | "premium";
  /** droits / meta optionnels */
  authorId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type CommentLite = {
  id: string;
  author: { id?: string; name: string; avatar?: string; isVerified?: boolean };
  createdAt: string; // ISO
  text: string;
  replies?: CommentLite[];
};
