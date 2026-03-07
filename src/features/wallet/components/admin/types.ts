export type WItem = {
  id: string;
  reference: string;
  currency?: string;
  amountGross: number;
  commission: number;
  amountNet: number;
  method: "USDT" | "BTC" | "BANK";
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED" | "FAILED";
  createdAt: string;
  user: { email: string; name: string } | null;
  paymentDetails: any;
  rejectionReason?: string;
  payoutRef?: string;
  proof?: string;
  failureReason?: string;
};

export const TABS = [
  { id: "pending", label: "En attente", statuses: ["PENDING"] },
  { id: "paid", label: "Validés / Payés", statuses: ["VALIDATED", "PAID"] },
  {
    id: "rejected",
    label: "Rejetés / Echecs",
    statuses: ["REJECTED", "FAILED"],
  },
];
