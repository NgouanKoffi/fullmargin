export type ProductStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "suspended";

export type MyProduct = {
  id: string;
  status: ProductStatus;
  /** moyenne des notes du produit (0–5), optionnelle côté API */
  ratingAvg?: number;
  /** nombre total d’avis du produit, optionnel côté API */
  ratingCount?: number;
};

export type SalesOrder = {
  id: string;
  createdAt: string;
  ref?: string | null;
  itemsCount: number;
  downloads: number;
  amount: number;
  received?: number | null;
};

export type SalesStats = {
  orders: number;
  downloads: number;
  gross: number;
  commission: number;
  net: number;
};
