// src/pages/admin/fullmetrix/types.ts

export type FmMetrixAdminItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  status: "active" | "expired" | "canceled" | "pending_crypto" | string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  provider: "stripe" | "fedapay" | "manual_grant" | "manual_crypto" | string;

  // Champs spécifiques Crypto
  cryptoRef?: string;
  amount?: number;
  network?: string;
};

export type AdminListRes = {
  items: FmMetrixAdminItem[];
  total: number;
};
