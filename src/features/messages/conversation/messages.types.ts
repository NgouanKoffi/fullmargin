// src/components/messages/messages.types.ts
import type { Conversation } from "../useConversations";

/* ---------- Types communs ---------- */
export type ChatAttachment = {
  kind?: "image" | "video" | "pdf" | "file";
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
  publicId?: string;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
  mine: boolean;
  attachments?: ChatAttachment[];
};

export type MessagesApiResponse = {
  ok: boolean;
  data?: {
    items: ChatMessage[];
    // côté backend, on renvoie aussi ça pour les groupes
    onlyAdminsCanPost?: boolean;
  };
  error?: string;
};

export type PendingAttachment = {
  id: string;
  file: File;
};

export type Mode = "private" | "group";

export type ConversationViewProps = {
  conversation: Conversation;
  mode: Mode;
  placeholder: string;
  showAdminBadge?: boolean;

  /** true si l'utilisateur courant est admin du groupe */
  isGroupAdmin?: boolean;

  /** true si le groupe est verrouillé POUR LES MEMBRES (pas pour l'admin) */
  chatLockedForMembers?: boolean;
};
