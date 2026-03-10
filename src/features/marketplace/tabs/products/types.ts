// src/pages/marketplace/tabs/products/types.ts

export type ProductType =
  | "robot_trading"
  | "indicator"
  | "ebook_pdf"
  | "template_excel";

/** Cohérent avec le backend + le composant (inclut 'suspended') */
export type ProductStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "suspended";

export type Pricing =
  | { mode: "one_time"; amount: number }
  | { mode: "subscription"; amount: number; interval: "month" | "year" };

export type Product = {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category?: string;
  type: ProductType;

  /** Aperçu image (optionnel) */
  imageUrl?: string;

  /** Galerie d’images (dataURL ou URLs) */
  gallery?: string[];

  /** Vidéos (dataURL ou liens externes / YouTube) */
  videoUrls?: string[];

  /** Fichier vendu : URL renvoyée par l’API après upload */
  fileUrl?: string;

  /** Métadonnées du fichier (optionnelles) */
  fileName?: string;
  fileMime?: string;

  pricing: Pricing;
  termsAccepted: boolean;
  status: ProductStatus;

  /** Règle d’éligibilité au badge (selon le type et les actions admin) */
  badgeEligible?: boolean;

  createdAt: number;
};
