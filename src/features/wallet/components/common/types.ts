export interface UnifiedWithdrawal {
  id: string;
  reference: string;
  date: string;
  amountNet: number;
  method: "USDT" | "BTC" | "BANK";
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED" | "FAILED" | string;
  user?: { email: string; name: string } | null; // Spécifique admin
  paymentDetails?: {
    cryptoAddress?: string;
    bankName?: string;
    bankIban?: string;
    bankSwift?: string;
    bankCountry?: string;
  };
  details?: string;
  rejectionReason?: string | null;
  failureReason?: string | null;
  payoutRef?: string | null;
  proof?: string | null;
}
