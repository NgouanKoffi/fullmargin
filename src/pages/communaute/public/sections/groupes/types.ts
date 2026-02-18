// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\sections\groupes\types.ts
export type PublicGroup = {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  communityName?: string | null;
  membersCount?: number | null;
  createdAt?: string | null;

  // "free" = groupe ouvert, "course" = lié à une formation payante
  accessType: "free" | "course";

  // 🔐 visibilité du groupe (envoyée par le backend)
  // - "public"  → visible pour tout le monde
  // - "private" → visible seulement si membre / owner de la communauté
  visibility?: "public" | "private";

  // ✅ IMPORTANT : utilisé dans GroupDetailsModal.tsx
  courseId?: string | null;
  courseTitle?: string | null;

  // ✅ ajout pour l'affichage des boutons sur les cards
  isOwner?: boolean; // vrai si l'utilisateur courant est admin du groupe
  isMember?: boolean; // vrai s'il est déjà membre du groupe
};

export type MembershipData = {
  isMember: boolean;
  isOwner?: boolean;
  canToggle?: boolean;
  membersCount?: number;

  // déjà été membre au moins une fois
  everMember?: boolean;

  // est inscrit à la formation ?
  enrolledToCourse?: boolean;

  // récupérés via /groups/:id/membership
  courseId?: string | null;
  courseTitle?: string | null;
};

export type PublicGroupsResponse = {
  ok: boolean;
  data?: {
    items: PublicGroup[];
  };
  error?: string;
};

export type MembershipResponse = {
  ok: boolean;
  data?: MembershipData;
  error?: string;
};
