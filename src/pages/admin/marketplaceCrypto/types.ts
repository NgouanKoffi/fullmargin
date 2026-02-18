// src/pages/admin/marketplaceCrypto/types.ts

export type MarketplacePaymentStatus =
  | "pending_crypto"
  | "paid"
  | "approved"
  | "rejected"
  | "expired"
  | "canceled"
  | "processing"
  | string;

export type MarketplaceCryptoAdminItem = {
  id: string; // id paiement (ou commande) côté backend
  createdAt: string;
  updatedAt?: string | null;

  userId: string;
  userName: string;
  userEmail: string | null;

  productId?: string | null;
  productName?: string | null;

  amount: number; // montant fiat
  currency: string; // XOF, EUR, USD...
  provider: string; // manual_crypto / stripe / etc.

  cryptoCurrency?: string | null; // ex: USDT
  cryptoNetwork?: string | null; // ex: TRC20
  cryptoRef?: string | null; // tx hash / ref saisie

  status: MarketplacePaymentStatus;
  notes?: string | null;
};

export type AdminListRes = {
  items: MarketplaceCryptoAdminItem[];
};
