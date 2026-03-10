/* ---------- Monnaie / Tarification ---------- */
export type MoneyPricing =
  | { mode: "one_time"; amount: number }
  | { mode: "subscription"; amount: number; interval: "month" | "year" };

/* ---------- Utilisateur (compact) ---------- */
export type UserLite = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string; // fallback possible (ex: "Koffi Emmanuel")
};

/* ---------- Catégories ---------- */
export type AdminCategory = {
  id: string;
  key: string;
  label: string;
  commissionPct: number;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/* ---------- Boutiques ---------- */
export type AdminShopItem = {
  id: string;
  name: string;
  signature: string;
  slug: string;
  owner: string;
  avatarUrl: string;
  createdAt?: string;
  updatedAt?: string;
  stats: {
    productsTotal: number;
    productsPublished: number;
  };
  status: "active" | "deleted" | "suspended";
  ownerName?: string;
  ownerEmail?: string;
};

/* ---------- Modération ---------- */
export type ModerationInfo = {
  required?: boolean;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reason?: string;
};

/* ---------- Produits (liste) ---------- */
export type AdminProductItem = {
  id: string;
  title: string;
  shortDescription: string;
  status: string; // pending|published|rejected|draft|suspended…
  type:
    | "robot_trading"
    | "indicator"
    | "mt4_mt5"
    | "ebook_pdf"
    | "template_excel"
    | string;
  imageUrl: string;
  pricing: MoneyPricing;
  shop: { id: string; name: string; slug: string } | null;
  category: { id: string; key: string; label: string } | null;
  ratingAvg: number;
  ratingCount: number;
  updatedAt?: string | null;
  badgeEligible?: boolean;
  featured?: boolean;
  deletedAt?: string | null;
  moderation?: ModerationInfo;

  /** ✅ Créateur du produit (à afficher dans la carte admin) */
  createdBy?: UserLite | null;
};

/* ---------- Produit complet (édition admin) ---------- */
export type AdminProductFull = AdminProductItem & {
  longDescription: string;
  fileName?: string;
  fileMime?: string;
  fileUrl?: string;
};

/* ---------- Pagination & enveloppes API ---------- */
export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

/* ---------- Catégories ---------- */
export type ListCategoriesRes = ApiResult<{ items: AdminCategory[] }>;
export type CreateCategoryBody = {
  key: string;
  label: string;
  commissionPct?: number;
  featured?: boolean;
};
export type CreateCategoryRes = ApiResult<AdminCategory>;
export type UpdateCategoryRes = ApiResult<{ updatedAt: string }>;
export type DeleteCategoryRes = ApiResult<{ deleted: true }>;

/* ---------- Boutiques ---------- */
export type ListShopsRes = ApiResult<{ items: AdminShopItem[] }>;
export type SetShopStatusRes = ApiResult<{ status: "suspended" | "active" }>;

/* ---------- Produits ---------- */
export type ProductQuery = {
  q?: string;
  status?: string;
  shopId?: string;
  categoryKey?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};
export type ListProductsRes = ApiResult<Paged<AdminProductItem>>;
export type GetAdminProductRes = ApiResult<{ product: AdminProductFull }>;

/* ---------- PATCH / BADGE / DELETE / RESTORE ---------- */
export type PatchProductBody = Partial<{
  status: string;
  verified: boolean;
  categoryId: string;
  categoryKey: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  type:
    | "robot_trading"
    | "indicator"
    | "mt4_mt5"
    | "ebook_pdf"
    | "template_excel"
    | string;
  imageUrl: string;
  fileName: string;
  fileMime: string;
  fileUrl: string;
  pricing: MoneyPricing;
  badgeEligible: boolean;
  featured: boolean;

  /** Motif de modération (rejet / suspension) transmis au PATCH */
  moderationReason: string;
}>;

export type PatchProductRes = ApiResult<{
  updatedAt: string;
  status?: string;
  badgeEligible?: boolean;
  featured?: boolean;
}>;
export type BadgeToggleRes = ApiResult<{
  id: string;
  badgeEligible: boolean;
  message: string;
}>;
export type DeleteProductRes = ApiResult<{
  id: string;
  deletedAt: string;
  message: string;
}>;
export type RestoreProductRes = ApiResult<{
  id: string;
  deletedAt: null;
  message: string;
}>;

/* =========================================================
   Codes promo
========================================================= */

export type PromoScope = "global" | "category" | "product" | "shop";
export type PromoType = "percent" | "amount";

export type AdminPromo = {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  scope: PromoScope;

  // ciblage optionnel selon la portée
  categoryKey?: string;
  productId?: string;
  productTitle?: string;
  shopId?: string;
  shopName?: string;

  // validité
  startsAt?: string | null;
  endsAt?: string | null;

  // quotas
  maxUse?: number | null;
  used?: number;

  active: boolean;

  createdAt?: string;
  updatedAt?: string;
};

/** Corps création/édition (mêmes clés que l’API backend) */
export type CreatePromoBody = Omit<
  AdminPromo,
  "id" | "used" | "createdAt" | "updatedAt"
>;

export type ListPromosRes = ApiResult<{ items: AdminPromo[] }>;
export type CreatePromoRes = ApiResult<{ id: string; updatedAt: string }>;
export type PatchPromoRes = ApiResult<{ updatedAt: string }>;
export type DeletePromoRes = ApiResult<{ deleted: true }>;

/* =========================================================
   Commissions admin
========================================================= */

export type AdminCommissionItem = {
  id: string;
  order: string;
  product: string;
  seller: string;
  buyer: string;
  shop: string | null;
  qty: number;
  currency: string; // ex: USD
  commissionRate: number;
  commissionAmount: number; // unités
  commissionAmountCents: number; // cents
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCommissionStats = {
  count: number;
  totalCommission: number;
  byCurrency: Record<
    string,
    {
      count: number;
      totalCommission: number;
    }
  >;
};

export type AdminCommissionPaged = {
  items: AdminCommissionItem[];
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  stats: AdminCommissionStats;
};

export type ListAdminCommissionsRes = ApiResult<AdminCommissionPaged>;

/** ✅ Types compacts (au lieu de any) pour le détail */
export type AdminOrderMini = {
  id: string;
  totalAmount?: number;
  currency?: string;
  status?: string;
  paidAt?: string | null;
  createdAt?: string;
};

export type SellerPayoutMini = {
  id: string;
  netAmount?: number;
  currency?: string;
  status?: "pending" | "available" | "paid" | "canceled" | "reversed";
  paidOutAt?: string | null;
  createdAt?: string;
};

export type AdminCommissionDetail = {
  commission: AdminCommissionItem;
  order: AdminOrderMini | null;
  payout: SellerPayoutMini | null;
};

export type AdminCommissionQuery = {
  page?: number;
  limit?: number;
  seller?: string;
  buyer?: string;
  product?: string;
  order?: string;
  currency?: string;
  dateFrom?: string; // ISO (YYYY-MM-DD toléré)
  dateTo?: string; // ISO
  q?: string;
  sort?: string; // ex: createdAt:desc
};
