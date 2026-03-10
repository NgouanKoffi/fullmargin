// ---------------- Finance — Types & Helpers (core) ----------------
// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\finance\core\types.ts

/* =========================================================================
   Devises
   - Inclut toutes les devises de ta table + quelques cryptos courantes
   - "FCFA" est gardé comme alias de compat (mappé vers XOF pour l'affichage)
   ========================================================================= */
export type Currency =
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
  | "KES"
  | "BTC"
  | "ETH"
  | "BNB"
  | "USDT"
  | "FCFA"; // alias compat → XOF

export const CRYPTO_CURRENCIES: ReadonlyArray<Currency> = [
  "BTC",
  "ETH",
  "BNB",
  "USDT",
];

/** Métadonnées simples pour labels/symboles */
export const CURRENCY_META: Record<
  Currency,
  { name: string; symbol: string; kind: "fiat" | "crypto" }
> = {
  USD: { name: "Dollar américain", symbol: "$", kind: "fiat" },
  EUR: { name: "Euro", symbol: "€", kind: "fiat" },
  XOF: { name: "Franc CFA (BCEAO)", symbol: "CFA", kind: "fiat" },
  XAF: { name: "Franc CFA (BEAC)", symbol: "CFA", kind: "fiat" },
  GBP: { name: "Livre sterling", symbol: "£", kind: "fiat" },
  JPY: { name: "Yen japonais", symbol: "¥", kind: "fiat" },
  CAD: { name: "Dollar canadien", symbol: "C$", kind: "fiat" },
  AUD: { name: "Dollar australien", symbol: "A$", kind: "fiat" },
  CNY: { name: "Yuan renminbi (Chine)", symbol: "¥", kind: "fiat" },
  CHF: { name: "Franc suisse", symbol: "CHF", kind: "fiat" },
  NGN: { name: "Naira nigérian", symbol: "₦", kind: "fiat" },
  ZAR: { name: "Rand sud-africain", symbol: "R", kind: "fiat" },
  MAD: { name: "Dirham marocain", symbol: "د.م.", kind: "fiat" },
  INR: { name: "Roupie indienne", symbol: "₹", kind: "fiat" },
  AED: { name: "Dirham des Émirats", symbol: "د.إ", kind: "fiat" },
  GHS: { name: "Cedi ghanéen", symbol: "₵", kind: "fiat" },
  KES: { name: "Shilling kényan", symbol: "KSh", kind: "fiat" },

  BTC: { name: "Bitcoin (crypto)", symbol: "₿", kind: "crypto" },
  ETH: { name: "Ethereum (crypto)", symbol: "Ξ", kind: "crypto" },
  BNB: { name: "Binance Coin (crypto)", symbol: "BNB", kind: "crypto" },
  USDT: { name: "Tether (stablecoin)", symbol: "USDT", kind: "crypto" },

  // Alias compat pour d’anciens enregistrements
  FCFA: { name: "Franc CFA (alias XOF)", symbol: "CFA", kind: "fiat" },
};

/** Options prêtes pour les <select> (on évite d’afficher l’alias FCFA) */
export const CURRENCY_OPTIONS: ReadonlyArray<{
  code: Currency;
  label: string;
}> = (Object.keys(CURRENCY_META) as Currency[])
  .filter((c) => c !== "FCFA")
  .map((code) => ({ code, label: `${code} — ${CURRENCY_META[code].name}` }));

/** Symbol “rapide” */
export function currencySymbol(cur: Currency): string {
  return CURRENCY_META[cur]?.symbol ?? cur;
}

/** Normalisation douce (FCFA → XOF pour Intl/affichage) */
export function normalizeCurrency(cur: Currency): Currency {
  return cur === "FCFA" ? "XOF" : cur;
}

/** Format monétaire (fiat via Intl, crypto en décimal + code) */
export function fmtMoney(n: number, cur: Currency, locale?: string): string {
  const v = Number(n) || 0;
  const code = normalizeCurrency(cur);
  const loc = locale ?? (code === "USD" ? "en-US" : "fr-FR");

  if (CRYPTO_CURRENCIES.includes(code)) {
    const s = new Intl.NumberFormat(loc, { maximumFractionDigits: 8 }).format(
      v
    );
    return `${s} ${code}`;
  }
  try {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: code as Exclude<Currency, "FCFA">,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    const s = new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(
      v
    );
    return `${s} ${currencySymbol(code)}`;
  }
}

/* =========================================================================
   Modèles
   ========================================================================= */
export type Account = {
  id: string;
  name: string;
  currency: Currency;
  initial: number;
  description?: string;
  createdAt: string; // ISO
};

export type TxType = "income" | "expense";
export type Recurrence = "fixe" | "mensuel";

// élargi pour inclure les détails "Fréquent" du formulaire
export type TxDetail =
  | "epargne"
  | "assurance"
  | "retrait"
  | "dette"
  | "investissement"
  | "autre"
  // nouveaux détails alignés sur le backend
  | "loyer"
  | "alimentation"
  | "transport"
  | "sante"
  | "education"
  | "loisirs"
  | "impots_taxes"
  | "abonnement"
  | "frais_bancaires"
  | "cadeaux_dons"
  | "entretien_reparation"
  | "achat_materiel"
  | "frais_service"
  | "voyage_deplacement"
  | "frais_professionnels";

export type Transaction = {
  id: string;
  accountId: string;
  type: TxType;
  amount: number; // positif; le signe est donné par `type`
  date: string; // ISO
  recurrence: Recurrence;
  detail: TxDetail;
  comment?: string;
  createdAt: string; // ISO
  parentId?: string; // pour occurrences auto (mensuelles)
};

/* =========================================================================
   Dates utilitaires
   ========================================================================= */
export const ym = (d: Date) => d.toISOString().slice(0, 7); // yyyy-mm
export const ymd = (d: Date) => d.toISOString().slice(0, 10); // yyyy-mm-dd
