// src/pages/marketplace/tabs/OrdersTab/types.ts

/* ------------ Types alignés backend (scope=purchases) ------------ */
export type PurchaseLine = {
  product: string;
  title: string;
  unitAmount: number;
  qty: number;
  seller: string;
  shop: string | null;

  // image possible depuis /profile/orders (fallback)
  imageUrl?: string;

  // promos (optionnels pour compat)
  promoCode?: string | null;
  wasDiscounted?: boolean;
  originalUnitAmount?: number | null;
  finalUnitAmount?: number | null;
};

export type AppliedPromo = { product: string; code: string };

export type PurchaseOrder = {
  id: string;
  status:
    | "requires_payment"
    | "processing"
    | "succeeded"
    | "failed"
    | "refunded"
    | "canceled"
    | string;
  currency: string;
  totalAmount: number;
  createdAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  receiptUrl?: string | null;
  sellers: string[];
  shops: string[];
  items: PurchaseLine[];
  appliedPromos?: AppliedPromo[];
};

export type PurchasesApi = {
  ok?: boolean;
  data?: { scope: "purchases"; items: PurchaseOrder[] };
};

/* ---- Licence (si le backend renvoie /batch -> license) ---- */
export type LicenseInfo = {
  kind?: "subscription" | "perpetual" | "trial" | string;
  status?: "active" | "expired" | "canceled" | "revoked" | string;
  startsAt?: string | null;
  expiresAt?: string | null; // null => illimitée
  isExpired?: boolean | null;
  daysRemaining?: number | null;
};

/* ---- Détails produits nécessaires pour l’onglet “téléchargeables” ---- */
export type PurchasedProduct = {
  id?: string;
  _id?: string;
  title?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileMime?: string;
  license?: LicenseInfo | null;
};

export type Subtab = "orders" | "downloads" | "subscriptions";
