// src/pages/journal/tabs/journal/types.ts

export type Id = string;

/**
 * Devises UI (fiat uniquement, pas de crypto)
 */
export type Currency =
  | "USD"
  | "EUR"
  | "FCFA" // alias UI -> stock XOF (UEMOA)
  | "FCFA_BEAC" // alias UI -> stock XAF (CEMAC)
  | "XOF"
  | "XAF"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CNY"
  | "CHF"
  | "NGN"
  | "ZAR"
  | "MAD"
  | "INR"
  | "AED"
  | "GHS"
  | "KES";

/** Dictionnaire devises (UI) */
export const CURRENCIES: Array<{
  code: Currency;
  name: string;
  symbol: string;
  serverCode?:
    | "USD"
    | "EUR"
    | "XOF"
    | "XAF"
    | "GBP"
    | "JPY"
    | "CAD"
    | "AUD"
    | "CNY"
    | "CHF"
    | "NGN"
    | "ZAR"
    | "MAD"
    | "INR"
    | "AED"
    | "GHS"
    | "KES";
}> = [
  { code: "USD", name: "Dollar américain", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "FCFA", name: "Franc CFA (UEMOA)", symbol: "CFA", serverCode: "XOF" },
  {
    code: "FCFA_BEAC",
    name: "Franc CFA (CEMAC)",
    symbol: "CFA",
    serverCode: "XAF",
  },
  { code: "XOF", name: "Franc CFA (UEMOA)", symbol: "CFA" },
  { code: "XAF", name: "Franc CFA (CEMAC)", symbol: "CFA" },
  { code: "GBP", name: "Livre sterling", symbol: "£" },
  { code: "JPY", name: "Yen japonais", symbol: "¥" },
  { code: "CAD", name: "Dollar canadien", symbol: "C$" },
  { code: "AUD", name: "Dollar australien", symbol: "A$" },
  { code: "CNY", name: "Yuan renminbi (Chine)", symbol: "¥" },
  { code: "CHF", name: "Franc suisse", symbol: "CHF" },
  { code: "NGN", name: "Naira nigérian", symbol: "₦" },
  { code: "ZAR", name: "Rand sud-africain", symbol: "R" },
  { code: "MAD", name: "Dirham marocain", symbol: "د.م." },
  { code: "INR", name: "Roupie indienne", symbol: "₹" },
  { code: "AED", name: "Dirham des Émirats", symbol: "د.إ" },
  { code: "GHS", name: "Cedi ghanéen", symbol: "₵" },
  { code: "KES", name: "Shilling kényan", symbol: "KSh" },
];

/** Utils d’accès */
export const findCurrency = (c: string | undefined | null) =>
  CURRENCIES.find((x) => x.code === String(c ?? "").toUpperCase()) ||
  CURRENCIES.find((x) => x.code === "USD")!;

/* ===== Entrée de journal ===== */
export type JournalEntry = {
  id: Id;
  accountId: Id | "";
  accountName: string;
  marketId: Id | "";
  marketName: string;
  strategyId: Id | "";
  strategyName: string;

  order: "Buy" | "Sell" | "";
  lot: string;
  result: "Gain" | "Perte" | "Nul" | "";
  detail: string;

  invested: string;
  resultMoney: string;
  resultPct: string;
  respect: "Oui" | "Non" | "";
  duration: string;

  timeframes: string[];
  session: "london" | "newyork" | "asiatique" | "";

  comment: string;
  imageDataUrl?: string;
  imageUrl?: string;
  date: string;
  createdAt: string;
};

export type Option = { id: Id; name: string };

/* ====== Options (const + unions dérivées) ====== */
export const ORDRE_OPTIONS = ["Buy", "Sell"] as const;
export type OrderValue = (typeof ORDRE_OPTIONS)[number];

export const RESULT_OPTIONS = ["Gain", "Perte", "Nul"] as const;
export type ResultValue = (typeof RESULT_OPTIONS)[number];

export const RESPECT_OPTIONS = ["Oui", "Non"] as const;
export type RespectValue = (typeof RESPECT_OPTIONS)[number];

export const DURATION_OPTIONS = [
  "Scalping (0-1h)",
  "Intraday (1h à 8h)",
  "Swing (1j - 7j)",
  "Long (7j - 1 an)",
] as const;
export type DurationValue = (typeof DURATION_OPTIONS)[number];

export const DETAIL_OPTIONS = [
  "Break-even",
  "Trailing Stop",
  "Margin Call",
  "Stop Loss touché",
  "Take Profit atteint",
  "Erreur de discipline",
] as const;
export type DetailValue = (typeof DETAIL_OPTIONS)[number];

export const TF_OPTIONS = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M15",
  "M30",
  "H1",
  "H2",
  "H4",
  "H8",
  "D1",
  "D2",
  "W",
  "MN",
  "1Y",
] as const;
export type TimeframeValue = (typeof TF_OPTIONS)[number];

export const SESSION_OPTIONS = [
  { value: "london", label: "London" },
  { value: "newyork", label: "New York" },
  { value: "asiatique", label: "Asiatique" },
] as const;
export type SessionValue = (typeof SESSION_OPTIONS)[number]["value"];
