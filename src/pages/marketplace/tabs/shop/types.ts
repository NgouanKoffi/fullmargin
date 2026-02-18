// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\shop\types.ts
export type ShopDraft = {
  name: string;
  desc: string;
  signature: string;
  /** DataURL persistée dans le LS (on ne garde PAS l'objet File) */
  avatarDataUrl?: string | null;
  coverDataUrl?: string | null;
  updatedAt: number; // epoch ms
};

export type ImagePickSpec = {
  label: string;
  accept?: string;
  maxBytes: number;
  /** “round” pour l’avatar, “rect-16x9” pour la couverture */
  shape: "round" | "rect-16x9";
};
